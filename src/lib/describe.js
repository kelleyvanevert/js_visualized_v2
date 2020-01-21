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
  } else if ("then" in data && "catch" in data) {
    let description = { type: "promise", state: "pending" };
    data
      .then(value => {
        description.state = "resolved";
        description.value = value;
      })
      .catch(reason => {
        description.state = "rejected";
        description.reason = reason;
      });
    return description;
  } else {
    return {
      type: "object",
      entries: Object.entries(data).map(([k, v]) => {
        return [k, describe(v)];
      })
    };
  }
}

const fake_constructors = {};

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
    case "promise": {
      if (node.state === "resolved") {
        return Promise.resolve(node.value);
      } else if (node.state === "rejected") {
        return Promise.reject(node.reason);
      } else {
        return new Promise(() => {});
      }
    }
    case "object": {
      const { __cname__, ...obj } = Object.fromEntries(
        node.entries.map(([k, v]) => [k, undescribe(v)])
      );
      if (__cname__ && __cname__ !== "Object") {
        const fc = (fake_constructors[__cname__] =
          fake_constructors[__cname__] ||
          eval(`function ${__cname__}(){}; ${__cname__}`));

        return Object.assign(new fc(), obj);
      }
      return obj;
    }
  }
}
