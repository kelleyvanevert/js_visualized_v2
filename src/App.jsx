import "styled-components/macro";
import React, { useMemo, useRef } from "react";
import Editor from "react-simple-code-editor";
import stripIndent from "common-tags/lib/stripIndent";

import { describe } from "./lib/describe";

import useCode from "./lib/useCode";

import Highlight from "./ui/Highlight";
import Menu from "./ui/Menu";
import Memory from "./ui/Memory";

import "./App.scss";

const presets = {
  number: `const value = 5;`,
  string: `const value = "Hello";`,
  Kelley: stripIndent`
    const value = {
      name: "Kelley",
      age: 27,
      hobbies: [
        { title: "Programming", level: "reasonable" },
        { title: "Playing double bass", level: "undetermined" },
        { title: "Sleeping", level: "advanced" }
      ]
    };
  `
};

export default function App() {
  const [code, set_code] = useCode(`hi`);

  const currentCodeDescription = useMemo(() => {
    try {
      const value = eval(`${code}; value`);
      return describe(value);
    } catch {
      return null;
    }
  }, [code]);

  const mostRecentRef = useRef();

  if (currentCodeDescription) {
    mostRecentRef.current = currentCodeDescription;
  }

  const { current: description } = mostRecentRef;

  return (
    <div className="App">
      <div
        css={`
          display: flex;
          align-items: center;
        `}
      >
        <Menu
          css="margin-right: 1rem;"
          items={Object.entries(presets).map(([title, preset_code]) => {
            return {
              key: title,
              title,
              active: preset_code === code,
              code: preset_code
            };
          })}
          onSelect={(item, close) => {
            set_code(item.code);
            close();
            const btn = document.getElementById("StepSliderThumb");
            btn && btn.focus();
          }}
        />
      </div>
      <div className="Editor">
        <Editor
          value={code}
          onValueChange={set_code}
          highlight={code => <Highlight code={code} />}
          padding={24}
          style={{
            fontFamily: "Menlo, Consolas, monospace",
            fontSize: 18,
            lineHeight: 1.5
          }}
          preClassName="language-js"
          textareaClassName="Code"
        />
      </div>
      <div>
        {description && <Memory node={description[0]} heap={description[1]} />}
      </div>
    </div>
  );
}
