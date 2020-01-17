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
        ${ns}.report = function(meta, value) {
          meta.num = ${ns}._steps.push(meta) - 1;
          meta.value = value;
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
    self.postMessage(JSON.parse(JSON.stringify({ code, transpiled, steps })));
  } catch (error) {
    console.log("  ERR");
    self.postMessage({ code, error });
  }
};
