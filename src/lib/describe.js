export function describe(data) {
  if (typeof data === "string") {
    return { type: "string", data };
  } else if (typeof data === "boolean") {
    return { type: "boolean", data };
  } else if (typeof data === "number") {
    return { type: "number", data };
  } else if (data === null) {
    return { type: "null", data };
  } else if (data === void 0) {
    return { type: "undefined", data };
  } else if (typeof data === "function") {
    return { type: "function" };
  } else if (Array.isArray(data)) {
    return { type: "array", data: data.map(describe) };
  } else {
    return {
      type: "object",
      entries: Object.entries(data).map(([k, v]) => {
        return [k, describe(v)];
      })
    };
  }
}

export function undescribe(node) {
  switch (node.type) {
    case "string":
    case "boolean":
    case "number":
    case "null":
      return node.data;
    case "undefined":
      return undefined;
    case "function": {
      return function() {};
    }
    case "array":
      return node.data.map(undescribe);
    case "object":
      return Object.fromEntries(
        node.entries.map(([k, v]) => [k, undescribe(v)])
      );
  }
}
