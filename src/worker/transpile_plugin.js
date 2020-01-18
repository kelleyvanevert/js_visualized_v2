export default function(babel, { ns = "__V__", detail = true } = {}) {
  const { types: t } = babel;

  function json(data) {
    if (typeof data === "string") {
      return t.stringLiteral(data);
    } else if (typeof data === "boolean") {
      return t.booleanLiteral(data);
    } else if (typeof data === "number") {
      return t.numericLiteral(data);
    } else if (data === null) {
      return t.nullLiteral();
    } else if (data === void 0) {
      return t.identifier("undefined");
    } else if (Array.isArray(data)) {
      return t.arrayExpression(data.map(json));
    } else if (data.$ast) {
      return data.$ast;
    } else {
      return t.objectExpression(
        Object.entries(data).map(([key, value]) => {
          return t.objectProperty(t.stringLiteral(key), json(value));
        })
      );
    }
  }

  let _cache_id = -1;

  function meta(category, node, scope, time) {
    const scopes = [];
    while (scope) {
      scopes.push(
        Object.fromEntries(
          Object.keys(scope.bindings).map(id => [
            id,
            {
              $ast: t.arrayExpression([
                t.callExpression(t.identifier(ns + ".cp"), [t.identifier(id)])
              ])
            }
          ])
        )
      );
      scope = scope.parent;
    }

    const metadata = {
      category,
      time,
      loc: node.loc,
      type: node.type,
      scopes
    };

    // if (scope._hasReturn) {
    //   metadata.scope["$return"] = { $ast: t.identifier(ns + ".return") };
    // }

    return json(metadata);
  }

  // A dirty trick to get expressionPath.traverse(visitor)
  //  to work also on the top level expression:
  //  just perform it on a sequence expression wrapped
  //  version of the expression
  function u(expressionNode) {
    return t.sequenceExpression([expressionNode]);
  }

  function visit_FunctionExpression(path) {
    const block = t.isBlockStatement(path.node.body);

    path.replaceWith(
      t.callExpression(t.identifier(ns + ".report"), [
        t.callExpression(
          t.memberExpression(
            t.functionExpression(
              null,
              path.node.params,
              block
                ? path.node.body
                : t.blockStatement([t.returnStatement(u(path.node.body))])
            ),
            t.identifier("bind")
          ),
          [t.thisExpression()]
        ),
        meta(
          "expression",
          path.node,
          // No idea why, but for some
          //  reason the scope of a Function node
          //  is not the surrounding scope of it as an expression,
          //  but rather it's own scope. Not what we're looking for!
          path.parentPath.scope,
          "after"
        )
      ])
    );

    path.skip();
    const body = path
      .get("arguments")[0]
      .get("callee")
      .get("object")
      .get("body");
    if (block) {
      body.traverse(visitor); // recurse
    } else {
      body
        .get("body")[0]
        .get("argument")
        .traverse(visitor); // recurse
    }
  }

  const visitor = {
    VariableDeclaration(path) {
      // This is an ugly trick to get the scope data "out" easily
      // If we leave the variables as let and const, then we run into non-initialized errors
      //  when reporting back the scope's contents.
      path.node.kind = "var";
    },
    Statement(path) {
      if (t.isBlockStatement(path.node)) return;

      // No idea why, but for some
      //  reason the scope of a Function node
      //  is not the surrounding scope of it as an expression,
      //  but rather it's own scope. Not what we're looking for!
      const scope = t.isFunction(path) ? path.parentPath.scope : path.scope;

      path.insertBefore(
        t.expressionStatement(
          t.callExpression(t.identifier(ns + ".report"), [
            t.identifier("undefined"),
            meta("statement", path.node, scope, "before")
          ])
        )
      );

      const report_before = path.getSibling(path.key - 1);
      report_before.skip();

      path.insertAfter(
        t.expressionStatement(
          t.callExpression(t.identifier(ns + ".report"), [
            t.identifier("undefined"),
            meta("statement", path.node, scope, "after")
          ])
        )
      );

      const report_after = path.getSibling(path.key + 1);
      report_after.skip();

      if (t.isReturnStatement(path)) {
        path.scope._hasReturn = true;
        path.replaceWith(
          t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.identifier(ns + ".return"),
              u(path.node.argument)
            )
          )
        );
        path.skip();
        path
          .get("expression")
          .get("right")
          .traverse(visitor); // recurse

        report_after.insertAfter(
          t.returnStatement(t.identifier(ns + ".return"))
        );
        report_after.getSibling(report_after.key + 1).skip();
      }
    },
    FunctionExpression: visit_FunctionExpression,
    ArrowFunctionExpression: visit_FunctionExpression,
    Expression(path) {
      if (t.isCallExpression(path)) {
        const contextual = t.isMemberExpression(path.get("callee"));

        // Automatically works even if non-contextual,
        //  because then the absence of the assignment,
        //  the cached item will undefined
        const cached_context = contextual
          ? t.memberExpression(
              t.identifier(ns + ".cache"),
              t.numericLiteral(++_cache_id),
              true
            )
          : t.identifier("undefined");

        const computed = contextual ? path.node.callee.computed : "irrelevant";

        path.replaceWith(
          t.callExpression(t.identifier(ns + ".report"), [
            t.callExpression(
              t.memberExpression(
                contextual
                  ? t.callExpression(t.identifier(ns + ".report"), [
                      t.memberExpression(
                        t.assignmentExpression(
                          "=",
                          cached_context,
                          u(path.node.callee.object)
                        ),
                        computed
                          ? u(path.node.callee.property)
                          : path.node.callee.property,
                        computed
                      ),
                      meta("expression", path.node.callee, path.scope, "after")
                    ])
                  : u(path.node.callee),
                t.identifier("call")
              ),
              [cached_context, ...path.node.arguments.map(u)]
            ),
            meta("expression", path.node, path.scope, "after")
          ])
        );

        path.skip();

        const expr = path.get("arguments")[0];
        const call = expr;
        let caller = call.get("callee").get("object");
        if (contextual) {
          caller = caller.get("arguments")[0];
          caller
            .get("object")
            .get("right")
            .traverse(visitor); // recurse
          if (computed) {
            caller.get("property").traverse(visitor); // recurse
          }
        } else {
          caller.traverse(visitor); // recurse
        }
        call
          .get("arguments")
          .slice(1)
          .forEach(argPath => {
            argPath.traverse(visitor); // recurse
          });
      } else {
        path.replaceWith(
          t.callExpression(t.identifier(ns + ".report"), [
            path.node,
            meta("expression", path.node, path.scope, "after")
          ])
        );
        path.skip();

        path.get("arguments")[0].traverse(visitor); // recurse
      }
    }
  };

  return {
    name: "stepperize",
    visitor
  };
}
