import React, { useState } from "react";
import Editor from "react-simple-code-editor";
// import { highlight, languages } from "prismjs/components/prism-core";
// import "prismjs/components/prism-clike";
// import "prismjs/components/prism-javascript";

import StepSlider from "./StepSlider";

import RUN from "./run.json";
import Highlight from "./Highlight";

export default function App() {
  const [code, set_code] = useState(RUN.code);

  const [at, set_at] = useState(0);
  const step = RUN.steps[Math.max(0, Math.min(RUN.steps.length - 1, at))];

  return (
    <div>
      <StepSlider
        max={RUN.steps.length - 1}
        value={at}
        onValueChange={set_at}
      />
      <Editor
        value={code}
        onValueChange={set_code}
        highlight={code => <Highlight code={code} loc={step.loc} />}
        // highlight={code => highlight(code, languages.js)}
        padding={10}
        style={{
          fontFamily: "Menlo, Consolas, monospace",
          fontSize: 20,
          lineHeight: 1.25
        }}
      />
    </div>
  );
}
