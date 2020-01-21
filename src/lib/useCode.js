import { useState, useEffect } from "react";
import {
  decompressFromEncodedURIComponent,
  compressToEncodedURIComponent
} from "lz-string";

export default function useCode(defaultInitialCode) {
  const initialCode =
    decompressFromEncodedURIComponent(parseQueryParams().code) ||
    defaultInitialCode;

  const [code, set_code] = useState(initialCode);

  useEffect(() => {
    window.location.hash = `?code=${compressToEncodedURIComponent(code)}`;
  }, [code]);

  return [code, set_code];
}

function parseQueryParams() {
  return window.location.hash
    .replace(/^#\??/, "")
    .split("&")
    .map(part => part.split("="))
    .reduce((result, parts) => {
      result[parts[0]] = decodeURIComponent(parts[1]);
      return result;
    }, {});
}
