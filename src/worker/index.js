import transpile from "./lib/transpile";

console.log("hello from worker");

self.onmessage = ({ data: { code } }) => {
  console.log("compiling...");
  try {
    const ns = "__V__";
    const transpiled = transpile(code, { ns });
    const steps = eval(`
      ((() => {
        const ${ns} = {
          _steps: [{}],
          _logs: []
        };
        ${ns}.__console_log = console.log;
        console.log = (...args) => ${ns}._logs.push(args);
        ${ns}.cache = {};
        ${ns}.cp = data => {
          if (typeof data === "boolean" || typeof data === "string" || typeof data === "number" || data === null || data === void 0) {
            return data;
          } else if (Array.isArray(data)) {
            return data.slice(0);
          } else if (typeof data === "function") {
            return data; // ?
          } else {
            return Object.fromEntries(Object.entries(data));
          }
        };
        ${ns}.report = function(meta, value) {
          meta.num = ${ns}._steps.push(meta) - 1;
          meta.value = ${ns}.cp(value);
          meta.logs = ${ns}._logs;
          ${ns}._logs = [];
          return value;
        };
        ${transpiled};
        console.log = ${ns}.__console_log;
        return ${ns}._steps;
      })())
    `);

    // To avoid some kind of permission problem,
    //  manually serialize then deserialize once
    console.log("  OK");
    self.postMessage({
      code,
      transpiled,
      steps: JSON.parse(
        JSON.stringify(steps, (key, val) => {
          return val === void 0 ? `${ns}.UNDEF` : val;
        }),
        (key, val) => {
          return val === `${ns}.UNDEF` ? void 0 : val;
        }
      )
    });
  } catch (error) {
    console.log("  ERR");
    self.postMessage({ code, error });
  }
};
