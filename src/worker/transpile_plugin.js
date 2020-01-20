// TODO:
// - Function entry. Added it in a while ago, then removed it
//    again when I stopped bailing out of reporting blocks,
//    but then started doing that again...

export default function(babel, { ns = "__V__" } = {}) {
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

  function _clone_and_detach(node) {
    const { loc, ...clone } = node;
    for (const key in clone) {
      if (typeof clone[key] === "object" && "type" in clone[key]) {
        clone[key] = _clone_and_detach(clone[key]);
      }
    }
    return clone;
  }

  function meta(category, node, scope, time) {
    // return json(node.type + "-" + time); // for easier debugging in the AST explorer

    const scopes = [];
    while (scope) {
      const ids = Object.keys(scope.bindings);
      // This is VERY sub-optimal (only showing scopes if non-empty),
      //  but it's the best band-aid I could come up with while leaving
      //  the following newly introduced problem unsolved:
      // The new traversal technique is to not recurse explicitly,
      //  and rather just bail out whenever a node has already been seen
      //  and/or w is a transform-introduced node (=== without source loc).
      // This allows waaay easier coding, but it also can accidentally
      //  introduce extra unnecessary scopes. We can identify a new scope with
      //  `!scope.block.loc`, but it can sometimes "inherit" the bindings of
      //  the original one. We can then articially hoist these bindings up
      //  manually, but due to the dynamic nature of the code-transform
      //  and because the `meta` fn is performed along-the-way, it seems
      //  "too late" to catch up with some of the transforms, making this
      //  solution behave erratically.  --->  Maybe we can do some kind
      //  of traversal-exit-time meta-filling?
      if (ids.length > 0) {
        scopes.push(
          Object.fromEntries(
            ids.map(id => [
              id,
              {
                $ast: t.arrayExpression([
                  t.callExpression(t.identifier(ns + ".cp"), [t.identifier(id)])
                ])
              }
            ])
          )
        );
      }
      scope = scope.parent;
    }

    const metadata = {
      category,
      time,
      loc: node.loc,
      type: node.type,
      scopes
    };

    return json(metadata);
  }

  function visit_FunctionExpression(path) {
    if (!path.node.loc || path.node._done) return;
    path.node._done = true;

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
                : t.blockStatement([t.returnStatement(path.node.body)])
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
  }

  const visitor = {
    VariableDeclaration(path) {
      // This is an ugly trick to get the scope data "out" easily
      // If we leave the variables as let and const, then we run into non-initialized errors
      //  when reporting back the scope's contents.
      path.node.kind = "var";
    },
    Statement(path) {
      if (!path.node.loc || path.node._done) return;
      path.node._done = true;

      // No idea why, but for some
      //  reason the scope of a Function node
      //  is not the surrounding scope of it as an expression,
      //  but rather it's own scope. Not what we're looking for!
      const scope = t.isFunction(path) ? path.parentPath.scope : path.scope;

      if (!t.isBlockStatement(path)) {
        path.insertBefore(
          t.expressionStatement(
            t.callExpression(t.identifier(ns + ".report"), [
              t.identifier("undefined"),
              meta("statement", path.node, scope, "before")
            ])
          )
        );

        path.insertAfter(
          t.expressionStatement(
            t.callExpression(t.identifier(ns + ".report"), [
              t.identifier("undefined"),
              meta("statement", path.node, scope, "after")
            ])
          )
        );
      }

      if (t.isReturnStatement(path)) {
        const report_after = path.getSibling(path.key + 1);

        path.replaceWith(
          t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.identifier(ns + ".return"),
              path.node.argument
            )
          )
        );

        report_after.insertAfter(
          t.returnStatement(t.identifier(ns + ".return"))
        );
      } else if (t.isWhileStatement(path)) {
        // Transform the while-statement just a bit,
        //  so that we can show a pre-test-expression report

        const tmp_test = t.memberExpression(
          t.identifier(ns + ".cache"),
          t.numericLiteral(++_cache_id),
          true
        );

        path.replaceWith(
          t.whileStatement(
            t.booleanLiteral(true),
            t.blockStatement([
              t.expressionStatement(
                t.callExpression(t.identifier(ns + ".report"), [
                  t.identifier("undefined"),
                  meta("expression", path.node.test, scope, "before")
                ])
              ),
              t.expressionStatement(
                t.assignmentExpression("=", tmp_test, path.node.test)
              ),
              t.ifStatement(
                t.unaryExpression("!", tmp_test),
                t.breakStatement()
              ),
              ...path.node.body.body
            ])
          )
        );
      } else if (t.isForStatement(path)) {
        // Transform the for-statement in such a way,
        //  that we can show pre- reports for the
        //  init, test and update elements.

        let init_type = path.node.init
          ? t.isVariableDeclaration(path.node.init)
            ? "decl"
            : "expr"
          : "none";

        let init_as_statement = {
          decl: () => path.node.init,
          expr: () => t.expressionStatement(path.node.init),
          none: () => t.expressionStatement(t.nullLiteral())
        }[init_type]();

        const tmp_test = t.memberExpression(
          t.identifier(ns + ".cache"),
          t.numericLiteral(++_cache_id),
          true
        );

        path.replaceWith(
          t.blockStatement([
            init_as_statement,
            t.whileStatement(
              t.booleanLiteral(true),
              t.blockStatement([
                t.expressionStatement(
                  t.callExpression(t.identifier(ns + ".report"), [
                    t.identifier("undefined"),
                    meta("expression", path.node.test, scope, "before")
                  ])
                ),
                t.expressionStatement(
                  t.assignmentExpression("=", tmp_test, path.node.test)
                ),
                t.ifStatement(
                  t.unaryExpression("!", tmp_test),
                  t.breakStatement()
                ),
                ...path.node.body.body,
                t.expressionStatement(
                  t.callExpression(t.identifier(ns + ".report"), [
                    t.identifier("undefined"),
                    meta("expression", path.node.update, scope, "before")
                  ])
                ),
                t.expressionStatement(path.node.update)
              ])
            )
          ])
        );
      }
    },
    FunctionExpression: visit_FunctionExpression,
    ArrowFunctionExpression: visit_FunctionExpression,
    Expression(path) {
      if (!path.node.loc || path.node._done) return;
      path.node._done = true;

      if (t.isAssignmentExpression(path)) {
        path.node.left = _clone_and_detach(path.node.left);
      } else if (t.isCallExpression(path)) {
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
                          path.node.callee.object
                        ),
                        computed
                          ? path.node.callee.property
                          : path.node.callee.property,
                        computed
                      ),
                      meta("expression", path.node.callee, path.scope, "after")
                    ])
                  : path.node.callee,
                t.identifier("call")
              ),
              [cached_context, ...path.node.arguments]
            ),
            meta("expression", path.node, path.scope, "after")
          ])
        );
      } else if (t.isUpdateExpression(path)) {
        if (path.node.prefix) {
          // original:          ++i
          // w/o intervention:  r2( ++r1(i) )
          // intervened:        ( i = r1(i) + 1, r2(i) )
          const arg = path.node.argument; // to be reported
          const _arg = _clone_and_detach(arg); // non-reported copy
          path.replaceWith(
            t.sequenceExpression([
              t.assignmentExpression(
                "=",
                _arg,
                t.binaryExpression(
                  path.node.operator[0],
                  arg,
                  t.numericLiteral(1)
                )
              ),
              t.callExpression(t.identifier(ns + ".report"), [
                _arg,
                meta("expression", path.node, path.scope, "after")
              ])
            ])
          );
        } else {
          // original:          i++
          // w/o intervention:  r2( r1(i)++ )
          // intervened:        ( TMP = r1(i), i = TMP + 1, r2(TMP) )
          const tmp = t.memberExpression(
            t.identifier(ns + ".cache"),
            t.numericLiteral(++_cache_id),
            true
          );
          const arg = path.node.argument; // to be reported
          const _arg = _clone_and_detach(arg); // non-reported copy
          path.replaceWith(
            t.sequenceExpression([
              t.assignmentExpression("=", tmp, arg),
              t.assignmentExpression(
                "=",
                _arg,
                t.binaryExpression(
                  path.node.operator[0],
                  tmp,
                  t.numericLiteral(1)
                )
              ),
              t.callExpression(t.identifier(ns + ".report"), [
                tmp,
                meta("expression", path.node, path.scope, "after")
              ])
            ])
          );
        }
      } else {
        path.replaceWith(
          t.callExpression(t.identifier(ns + ".report"), [
            path.node,
            meta("expression", path.node, path.scope, "after")
          ])
        );
      }
    }
  };

  return {
    name: "stepperize",
    visitor
  };
}
