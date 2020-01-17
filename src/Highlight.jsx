import React, { useState, useRef, useLayoutEffect } from "react";

import theme from "./theme";

const hpad = 3;
const vpad = 1;

export default function Highlight({ code, loc }) {
  const container = useRef();
  const [h, set_h] = useState(0);
  const [w, set_w] = useState(0);

  const N = code.split("\n").length;
  const ranges = loc_to_ranges(code, loc);

  function recalculateCharacterSize() {
    if (container.current) {
      const { width, height } = container.current.getBoundingClientRect();
      let _h = height / N;
      _h = Math.round(_h * 10000) / 10000;
      if (_h !== h) set_h(_h);

      let _w = width / Math.max(...code.split("\n").map(line => line.length));
      _w = Math.round(_w * 10000) / 10000;
      if (_w !== w) set_w(_w);
    }
  }

  // Once every time the code changer for sure (incl. initial mount)
  useLayoutEffect(recalculateCharacterSize, [code]);
  // ..but also let's be 100% sure it's up to date
  recalculateCharacterSize();

  return (
    <div
      ref={container}
      style={{
        display: "inline-flex",
        position: "relative"
      }}
    >
      <div
        style={{ zIndex: 20 }}
        dangerouslySetInnerHTML={{ __html: highlight_bold(code, loc) }}
      />
      {Array.from({ length: N }).map((_, i) => {
        const range = ranges[Math.min(i, ranges.length - 1)];
        return (
          <div
            key={i}
            style={{
              zIndex: 10,
              position: "absolute",
              transition: "all .1s ease",
              background: theme.primary,
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

// TODO actually encode html characters
function highlight_bold(code, loc) {
  if (!loc) {
    return code;
  }

  const lines = code.split("\n");

  const before = [
    ...lines.slice(0, loc.start.line - 1),
    lines[loc.start.line - 1].slice(0, loc.start.column)
  ].join("\n");

  const highlighted =
    loc.start.line === loc.end.line
      ? lines[loc.start.line - 1].slice(loc.start.column, loc.end.column)
      : [
          lines[loc.start.line - 1].slice(loc.start.column),
          ...lines.slice(loc.start.line, loc.end.line - 1),
          lines[loc.end.line - 1].slice(0, loc.end.column)
        ].join("\n");

  const after = [
    lines[loc.end.line - 1].slice(loc.end.column),
    ...lines.slice(loc.end.line)
  ].join("\n");

  return `${before}<span style="font-weight: bold;">${highlighted}</span>${after}`;
}

function loc_to_ranges(code, loc) {
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
