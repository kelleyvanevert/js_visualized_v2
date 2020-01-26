// Usage:
// description = [node, heap] = describe(value)
export function describe(value, heap = [], map = new Map()) {
  if (typeof value === "string") {
    return [{ category: "primitive", type: "string", value }, heap];
  } else if (typeof value === "boolean") {
    return [{ category: "primitive", type: "boolean", value }, heap];
  } else if (typeof value === "number") {
    return [{ category: "primitive", type: "number", value }, heap];
  } else if (value === null) {
    return [{ category: "primitive", type: "null", value }, heap];
  } else if (value === void 0) {
    return [{ category: "primitive", type: "undefined", value }, heap];
  } else if (typeof value === "symbol") {
    return [{ category: "primitive", type: "symbol", value }, heap];
  } else if (map.has(value)) {
    return [{ category: "compound", at: map.get(value) }, heap];
  } else {
    const at = heap.length;
    map.set(value, at);

    const obj = { type: "object", entries: [] };
    heap.push(obj);

    if (typeof value === "function") {
      obj.type = "function";
    } else if ("then" in value && "catch" in value) {
      obj.type = "promise";
    } else if (Array.isArray(value)) {
      obj.type = "array";
      obj.length = value.length;
    } else {
      obj.cname = value.constructor.name;
    }

    Object.entries(value).forEach(([key, v]) => {
      const [described] = describe(v, heap, map);
      obj.entries.push([key, described]);
    });

    return [{ category: "compound", at }, heap];
  }
}

// Usage:
// value = undescribe(description = [node, heap])
const FAKE_CONSTRUCTORS = {};
export function undescribe([node, heap], revived = []) {
  if (node.category === "primitive") {
    return node.value;
  } else if (revived[node.at]) {
    return revived[node.at];
  }

  const obj = heap[node.at];
  let value = {};

  if (obj.type === "function") {
    value = (() => () => {})(); // To avoid the transpiler naming it `f value()`
  } else if (obj.type === "promise") {
    value = new Promise(() => {});
  } else if (obj.type === "array") {
    value = [];
    value.length = obj.length;
  } else if (obj.cname) {
    value = new (FAKE_CONSTRUCTORS[obj.cname] =
      FAKE_CONSTRUCTORS[obj.cname] ||
      eval(`function ${obj.cname}(){}; ${obj.cname}`))();
  }

  revived[node.at] = value;

  obj.entries.forEach(([key, node]) => {
    value[key] = undescribe([node, heap], revived);
  });

  return value;
}

// const a = {};
// const b = { a };
// a.b = b;

// const d = describe([a]);

// // console.log(JSON.stringify(d, null, 2));
// console.log(undescribe(d));
