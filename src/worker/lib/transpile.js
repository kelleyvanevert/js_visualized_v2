import * as babel from "@babel/core";
import transpilerPlugin from "./transpile_plugin";

export default function transpile(code, config = {}) {
  const transpiled = babel.transformSync(code, {
    plugins: [[transpilerPlugin, config]]
  });

  return transpiled.code;
}
