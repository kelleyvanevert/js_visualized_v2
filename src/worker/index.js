import * as babel from "@babel/core";

import { describe } from "../lib/describe";
import transpilerPlugin from "./transpile_plugin";

const id = Math.floor(Math.random() * 1000);

console.log("hello from worker");

setInterval(() => {
  self.postMessage({ alive: id });
}, 100);

self.onmessage = ({ data: { code, config = {} } }) => {
  console.log("compiling...");
  const ns = (config.ns = config.ns || "__V__");
  try {
    const transpiled = transpile(code, config);
    let getSteps = eval(`
      (((undefined) => {
        const console = new (class console {
          log(...args) {
            ${ns}._logs.push(${ns}.cp(args));
          }
        });
        const ${ns} = {
          _t0: Date.now(),
          _steps: [{}],
          _updated: false,
          _logs: [],
          _tmp: {}
        };
        ${ns}.cp = data => {
          if (typeof data === "boolean" || typeof data === "string" || typeof data === "number" || data === null || data === void 0) {
            return data;
          } else if (Array.isArray(data)) {
            return data.slice(0).map(${ns}.cp);
          } else if (typeof data === "function") {
            // don't clone functions
            return data;
          } else if (typeof data === "object" && "then" in data && "catch" in data) {
            // don't clone promises
            return data;
          } else {
            const ownProps = Object.fromEntries(Object.entries(data).map(${ns}.cp));
            ownProps.__cname__ = data.constructor.name;
            return ownProps;
          }
        };
        ${ns}.cache = {};
        ${ns}.report = function(value, meta) {
          meta.dt = Date.now() - ${ns}._t0;
          meta.num = ${ns}._steps.push(meta) - 1;
          meta.value = ${ns}.cp(value);
          meta.logs = ${ns}._logs;
          ${ns}._logs = [];
          ${ns}._updated = true;
          return value;
        };
        ${ns}.app = function () {
          ${transpiled};
        };
        ${ns}.app();
        return () => {
          const res = [${ns}._steps, ${ns}._updated];
          ${ns}._updated = false;
          return res;
        };
      })())
    `);

    // To avoid some kind of permission problem,
    //  manually serialize then deserialize once
    console.log("  OK");
    let TIMEOUT = 500;
    let steps,
      updated,
      run = 0;

    function messageUpdates() {
      // stop polling after 1 minute
      if (++run * TIMEOUT > 60000) {
        clearInterval(interval);
      }

      [steps, updated] = getSteps();
      if (updated) {
        self.postMessage({
          code,
          transpiled,
          config,
          steps: describe(steps)
        });
      }
    }
    let interval = setInterval(messageUpdates, TIMEOUT);
    messageUpdates();
  } catch (error) {
    console.error("  ERR", error);
    self.postMessage({ code, config, error });
  }
};

function transpile(code, config) {
  const transpiled = babel.transformSync(code, {
    plugins: [[transpilerPlugin, config]]
  });

  return transpiled.code;
}
