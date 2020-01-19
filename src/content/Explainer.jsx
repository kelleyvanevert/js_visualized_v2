import "styled-components/macro";
import React, { useState } from "react";
import { stripIndent } from "common-tags";
import { highlight, languages } from "prismjs/components/prism-core";

import { IoIosArrowDropdownCircle } from "react-icons/io";

export default function Explainer() {
  const [expanded, set_expanded] = useState(false);

  return (
    <div>
      <h2
        css={`
          cursor: pointer;
          transition: color 0.15s ease;
          color: #aaa;
          &:hover {
            color: #777;
          }
          ${expanded && `color: black !important;`}
        `}
        onClick={() => set_expanded(!expanded)}
      >
        How is it made?{" "}
        <IoIosArrowDropdownCircle
          css={`
            vertical-align: text-bottom;
            margin-bottom: 2px;
            transition: transform 0.15s ease;
            ${expanded ? "transform: rotate(180deg);" : ""}
          `}
        />
      </h2>
      {expanded && (
        <div
          css={`
            animation: Explainer_enter_kf 0.15s ease;

            @keyframes Explainer_enter_kf {
              from {
                transform: translate(0, 10px);
                opacity: 0;
              }
              to {
                transform: translate(0, 0);
                opacity: 1;
              }
            }
          `}
        >
          <p>
            The tool uses a <a href="https://babeljs.io/">Babel</a> syntax
            transform to add in little "reporter" function calls around most
            every statement and/or expression in the code. For example, this
            code:
          </p>
          <Code>{stripIndent`
            let x = 6;
          `}</Code>
          <p>is translated into:</p>
          <Code>{stripIndent`
            _report("VariableDeclaration", ...);
            let x = _report(6, "NumericLiteral", ...);
          `}</Code>
          <p>
            These reporter calls note all kinds of metadata about the node in
            question, like its location, the current values of all variables
            currently in scope, etc.
          </p>
          <p>
            The transformed code is run inside of a web worker, and all the
            steps are recorded. These are then turned into the interactive
            visualization you see above.
          </p>
          <p>
            For more info, check the{" "}
            <a href="https://github.com/kelleyvanevert/js_visualized_v2">
              source code
            </a>{" "}
            <em>(all contributions are welcome!)</em>, or the slightly outdated{" "}
            <a href="https://observablehq.com/@kelleyvanevert/visualizing-js-execution-2">
              Observable notebook
            </a>{" "}
            I used for prototyping.
          </p>
        </div>
      )}
    </div>
  );
}

function Code({ children }) {
  return (
    <pre
      css={`
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        display: inline-block;
        margin: 0 0 0 10px;
      `}
      dangerouslySetInnerHTML={{
        __html: highlight(children, languages.js)
      }}
    />
  );
}
