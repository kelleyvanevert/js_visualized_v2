import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback
} from "react";

import { highlight, languages } from "prismjs/components/prism-core";

import theme from "./theme";

const hpad = 3;
const vpad = 1;

export default function Highlight({ code, step }) {
  const container = useRef();
  const [h, set_h] = useState(0);
  const [w, set_w] = useState(0);

  const N = code.split("\n").length;
  const ranges = loc_to_ranges(code, step && step.loc);

  const recalculateCharacterSize = useCallback(() => {
    if (container.current) {
      const { width, height } = container.current.getBoundingClientRect();

      let _h = height / N;
      _h = Math.round(_h * 10000) / 10000;
      if (_h && _h !== h) set_h(_h);

      let _w = width / Math.max(...code.split("\n").map(line => line.length));
      _w = Math.round(_w * 10000) / 10000;
      if (_w && _w !== w) set_w(_w);
    }
  }, [code]);

  // Once every time the code changer for sure (incl. initial mount)
  useLayoutEffect(recalculateCharacterSize, [code]);

  useEffect(() => {
    window.addEventListener("resize", recalculateCharacterSize);
    return () => {
      window.removeEventListener("resize", recalculateCharacterSize);
    };
  }, [recalculateCharacterSize]);

  return (
    <div
      ref={container}
      style={{
        display: "inline-flex",
        position: "relative",
        whiteSpace: "pre",
        overflowWrap: "normal",
        overflowX: "hidden"
      }}
    >
      <div
        style={{ zIndex: 20 }}
        dangerouslySetInnerHTML={{
          __html: highlight(
            code + (code.split("\n").slice(-1)[0] === "" ? " " : ""),
            languages.js
          )
        }}
      />
      {ranges.length > 0 &&
        Array.from({ length: N }).map((_, i) => {
          const range = ranges[Math.min(i, ranges.length - 1)];
          return (
            <div
              key={i}
              style={{
                zIndex: 10,
                position: "absolute",
                transition: "all .1s ease",
                background: theme[step.time].bg,
                top: `${(range.line - 1) * h - vpad}px`,
                height: `${h + 2 * vpad}px`,
                left: `${range.a * w - hpad}px`,
                width: `${(range.b - range.a) * w + 2 * hpad}px`
              }}
            />
          );
        })}
    </div>
  );
}

function loc_to_ranges(code, loc) {
  if (!loc) return [];

  const { start, end } = loc;
  const codelines = code.split("\n");
  return start.line === end.line
    ? [{ line: start.line, a: start.column, b: end.column }]
    : [
        {
          line: start.line,
          a: start.column,
          b: codelines[start.line - 1].length
        },
        ...Array.from({ length: end.line - start.line - 1 })
          .map((_, i) => i + start.line + 1)
          .map(line => ({ line, a: 0, b: codelines[line - 1].length })),
        { line: end.line, a: 0, b: end.column }
      ];
}
