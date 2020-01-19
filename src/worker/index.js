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
    let steps = eval(`
      ((() => {
        const ${ns} = {
          _steps: [{}],
          _logs: []
        };
        ${ns}.cp = data => {
          if (typeof data === "boolean" || typeof data === "string" || typeof data === "number" || data === null || data === void 0) {
            return data;
          } else if (Array.isArray(data)) {
            return data.slice(0).map(${ns}.cp);
          } else if (typeof data === "function") {
            return data; // ?
          } else {
            return Object.fromEntries(Object.entries(data).map(${ns}.cp));
          }
        };
        ${ns}.__console_log = console.log;
        console.log = (...args) => ${ns}._logs.push(${ns}.cp(args));
        ${ns}.cache = {};
        ${ns}.report = function(value, meta) {
          meta.num = ${ns}._steps.push(meta) - 1;
          meta.value = ${ns}.cp(value);
          meta.logs = ${ns}._logs;
          ${ns}._logs = [];
          return value;
        };
        ${ns}.app = function () {
          ${transpiled};
        };
        ${ns}.app();
        console.log = ${ns}.__console_log;
        return ${ns}._steps;
      })())
    `);

    steps = steps.filter(step => {
      if (!config.detail) {
        if (
          step.category === "expression" ||
          (step.category === "statement" && step.time === "before")
        ) {
          return false;
        }
      }
      return true;
    });

    // To avoid some kind of permission problem,
    //  manually serialize then deserialize once
    console.log("  OK");
    self.postMessage({
      code,
      transpiled,
      config,
      steps: describe(steps)
    });
  } catch (error) {
    console.log("  ERR");
    self.postMessage({ code, config, error });
  }
};

function transpile(code, config) {
  const transpiled = babel.transformSync(code, {
    plugins: [[transpilerPlugin, config]]
  });

  return transpiled.code;
}
