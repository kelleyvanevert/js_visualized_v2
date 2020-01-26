/*

    The visitor in bird's eye view:
    ===
    - Change let/const to var for scope reporting

    - Statements => report before and after
      - don't pre-/post report block statements
      - customized: while statement (added pre-reporting)
      - customized: for statement   (added pre-reporting)

    - Expressions => only report after
      - don't report LVals of assignments
      - solved: reporting function calls and context binding
      - semi-solved: update expressions

    TODO:
    ===
    - Function entry. Added it in a while ago, then removed it
      again when I stopped bailing out of reporting blocks,
      but then started doing that again...

    - Track the return value of a function execution's scope
      (there's a partial solution in the code already)

    - Function declaration hoisting. JavaScript just does it,
      and the scope visualizer shows it, but the stepper doesn't.

    - Assignment security of let/const. (Currently turning
      everything into var, in order to get the scope visualizer
      to work.)

*/

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

  function clone_and_detach(node) {
    const { loc, ...clone } = node;
    for (const k in clone) {
      if (typeof clone[k] === "object" && "type" in clone[k]) {
        clone[k] = clone_and_detach(clone[k]);
      } else if (
        Array.isArray(clone[k]) &&
        clone[k][0] &&
        "type" in clone[k][0]
      ) {
        clone[k] = clone[k].map(clone_and_detach);
      }
    }
    return clone;
  }

  function bailout_lval(node) {
    node._done = true;
    for (const k in node) {
      // We bail out of reporting on LVals of assignment expressions,
      //  EXCEPT in the case of computed properties, for example:
      // arr[i + 1] = "hi";
      const is_computed_property =
        k === "property" && t.isMemberExpression(node) && node.computed;

      if (
        !is_computed_property &&
        typeof node[k] === "object" &&
        "type" in node[k]
      ) {
        bailout_lval(node[k]);
      }
    }
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
      if (scope._original) {
        // ids.length > 0
        scopes.push(
          Object.fromEntries(
            ids.map(id => [
              id,
              {
                $ast: t.callExpression(t.identifier(ns + ".describe"), [
                  t.identifier(id)
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

  function REPORT(value, node, scope, time) {
    return t.callExpression(t.identifier(ns + ".report"), [
      value || t.identifier("undefined"),
      meta(t.isExpression(node) ? "expression" : "statement", node, scope, time)
    ]);
  }

  let _cache_id = -1;
  function make_temporary_variable() {
    return t.memberExpression(
      t.identifier(ns + ".cache"),
      t.numericLiteral(++_cache_id),
      true
    );
  }

  const visitor = {
    // This is an ugly trick to get the scope data "out" easily
    // If we leave the variables as let and const, then we run into non-initialized errors
    //  when reporting back the scope's contents.
    VariableDeclaration(path) {
      path.node.kind = "var";
    },
    Program(path) {
      path.scope._original = true;
    },
    Statement(path) {
      if (!path.node.loc || path.node._done) return;
      path.node._done = true;

      // No idea why, but for some
      //  reason the scope of a Function node
      //  is not the surrounding scope of it as an expression,
      //  but rather it's own scope. Not what we're looking for!
      const scope = t.isFunction(path) ? path.parentPath.scope : path.scope;

      scope._original = true;

      if (!t.isBlockStatement(path)) {
        path.insertBefore(
          t.expressionStatement(REPORT(null, path.node, scope, "before"))
        );

        path.insertAfter(
          t.expressionStatement(REPORT(null, path.node, scope, "after"))
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

        const TMP = make_temporary_variable();

        path.replaceWith(
          t.whileStatement(
            t.booleanLiteral(true),
            t.blockStatement([
              t.expressionStatement(
                REPORT(null, path.node.test, scope, "before")
              ),
              t.expressionStatement(
                t.assignmentExpression("=", TMP, path.node.test)
              ),
              t.ifStatement(t.unaryExpression("!", TMP), t.breakStatement()),
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

        const TMP = make_temporary_variable();

        const bodyScope = path.get("body").scope;
        bodyScope._original = true;

        path.replaceWith(
          t.blockStatement([
            init_as_statement,
            t.whileStatement(
              t.booleanLiteral(true),
              t.blockStatement([
                t.expressionStatement(
                  REPORT(null, path.node.test, bodyScope, "before")
                ),
                t.expressionStatement(
                  t.assignmentExpression("=", TMP, path.node.test)
                ),
                t.ifStatement(t.unaryExpression("!", TMP), t.breakStatement()),
                ...path.node.body.body,
                t.expressionStatement(
                  REPORT(null, path.node.update, bodyScope, "before")
                ),
                t.expressionStatement(path.node.update)
              ])
            )
          ])
        );
      }
    },
    ArrowFunctionExpression(path) {
      if (!path.node.loc || path.node._done) return;
      path.node._done = true;

      // No idea why, but for some
      //  reason the scope of a Function node
      //  is not the surrounding scope of it as an expression,
      //  but rather it's own scope. Not what we're looking for!
      const scope = path.parentPath.scope;

      scope._original = true;

      path.replaceWith(
        REPORT(
          t.callExpression(
            t.memberExpression(
              t.functionExpression(
                null,
                path.node.params,
                t.isBlockStatement(path.node.body)
                  ? path.node.body
                  : t.blockStatement([t.returnStatement(path.node.body)])
              ),
              t.identifier("bind")
            ),
            [t.thisExpression()]
          ),
          path.node,
          scope,
          "after"
        )
      );
    },
    FunctionExpression(path) {
      if (!path.node.loc || path.node._done) return;
      path.node._done = true;

      // No idea why, but for some
      //  reason the scope of a Function node
      //  is not the surrounding scope of it as an expression,
      //  but rather it's own scope. Not what we're looking for!
      const scope = path.parentPath.scope;

      scope._original = true;

      path.replaceWith(REPORT(path.node, path.node, scope, "after"));
    },
    Expression(path) {
      if (!path.node.loc || path.node._done) return;
      path.node._done = true;

      path.scope._original = true;

      if (t.isAssignmentExpression(path)) {
        bailout_lval(path.node.left);
      }

      if (t.isCallExpression(path)) {
        const contextual = t.isMemberExpression(path.get("callee"));

        // Automatically works even if non-contextual,
        //  because then the absence of the assignment,
        //  the cached item will undefined
        const TMP_context = contextual
          ? make_temporary_variable()
          : t.identifier("undefined");

        const computed = contextual
          ? path.node.callee.computed
          : "(irrelevant)";

        path.replaceWith(
          REPORT(
            t.callExpression(
              t.memberExpression(
                contextual
                  ? REPORT(
                      t.memberExpression(
                        t.assignmentExpression(
                          "=",
                          TMP_context,
                          path.node.callee.object
                        ),
                        path.node.callee.property,
                        computed
                      ),
                      path.node.callee,
                      path.scope,
                      "after"
                    )
                  : path.node.callee,
                t.identifier("call")
              ),
              [TMP_context, ...path.node.arguments]
            ),
            path.node,
            path.scope,
            "after"
          )
        );
      } else if (t.isUpdateExpression(path)) {
        // Technically speaking, this is not fully correct, because
        //  of the case where the non-reported copy contains a side-effect.
        // For example:
        //
        //     let c = 0;
        //     let arr = [0];
        //     arr[c++]++;
        //
        // Fixing this edge-case would require recursively temporarily
        //  storing computed property names, something like this:
        //
        //     ++E
        //     ( E_compute = r1(E_cache) + 1, r2(E_cache) )
        //
        //     where
        //       [E_compute, E_cache] = split(E)
        //
        //       split:
        //         o[p] ->  (TMP = p, o[TMP])    // E_compute
        //                  o[TMP]               // E_cache
        //         e    ->  e                    // E_compute
        //                  e                    // E_cache

        if (path.node.prefix) {
          // original:          ++i
          // w/o intervention:  r2( ++r1(i) )
          // intervened:        ( i = r1(i) + 1, r2(i) )
          const arg = path.node.argument; // to be reported
          const __arg = clone_and_detach(arg); // non-reported copy
          path.replaceWith(
            t.sequenceExpression([
              t.assignmentExpression(
                "=",
                __arg,
                t.binaryExpression(
                  path.node.operator[0],
                  arg,
                  t.numericLiteral(1)
                )
              ),
              REPORT(__arg, path.node, path.scope, "after")
            ])
          );
        } else {
          // original:          i++
          // w/o intervention:  r2( r1(i)++ )
          // intervened:        ( TMP = r1(i), i = TMP + 1, r2(TMP) )
          const TMP = make_temporary_variable();
          const arg = path.node.argument; // to be reported
          const __arg = clone_and_detach(arg); // non-reported copy
          path.replaceWith(
            t.sequenceExpression([
              t.assignmentExpression("=", TMP, arg),
              t.assignmentExpression(
                "=",
                __arg,
                t.binaryExpression(
                  path.node.operator[0],
                  TMP,
                  t.numericLiteral(1)
                )
              ),
              REPORT(TMP, path.node, path.scope, "after")
            ])
          );
        }
      } else {
        // Finally, the normal case!
        path.replaceWith(REPORT(path.node, path.node, path.scope, "after"));
      }
    }
  };

  return {
    name: "stepperize",
    visitor
  };
}
