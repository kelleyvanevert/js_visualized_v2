import "styled-components/macro";
import React, { useState, useEffect } from "react";
import { useThrottle } from "react-use";
import Editor from "react-simple-code-editor";

import { undescribe } from "./lib/describe";
import add_waiting_time_steps from "./lib/add_waiting_time_steps";
import presets from "./lib/presets";

import useCode from "./lib/useCode";
import useMostRecent from "./lib/useMostRecent";
import useReplacableWorker from "./lib/useReplacableWorker";

import StepSlider from "./ui/StepSlider";
import Highlight from "./ui/Highlight";
import Menu from "./ui/Menu";
import Step from "./ui/Step";

import "./App.scss";

export default function App() {
  const [code, set_code] = useCode(presets["Promise / fetch"]);
  const [cache, set_cache] = useState({});

  const worker = useReplacableWorker(data => {
    if (data.steps) {
      data.steps = add_waiting_time_steps(undescribe(data.steps));
    }
    set_cache(cache => {
      return {
        ...cache,
        [data.code]: data
      };
    });
  });

  useEffect(() => {
    if (worker && !cache[code]) {
      worker.postMessage({ code });
    }
  }, [code, cache, worker]);

  const state = cache[code] || { loading: true };
  const { loading, steps } = state;
  const { loading: loading_throttled, error } = useThrottle(state, 200);

  const max = useMostRecent(steps, []).length - 1;
  const [at, set_at] = useState(0);
  const step =
    steps && steps[Math.max(0, Math.min(steps.length - 1, Math.round(at)))];

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
            set_at(0);
            close();
            const btn = document.getElementById("StepSliderThumb");
            btn && btn.focus();
          }}
        />
        <StepSlider
          max={max}
          step={step}
          value={at}
          onValueChange={set_at}
          loading={loading}
          error={error}
        />
      </div>
      <div className="Editor">
        <Editor
          value={code}
          onValueChange={set_code}
          highlight={code => <Highlight code={code} step={step} />}
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
      {step ? (
        <Step
          step={step}
          logs={steps
            .slice(0, step.num + 1)
            .map(s => s.logs || [])
            .flat()}
        />
      ) : error ? (
        <div className="InfoPanelGroup">
          <div className="InfoPanel">
            <h2 css="color: #c00;">Uh oh!</h2>
            <pre css="color: #c00;">
              {typeof error === "object"
                ? error.message
                : typeof error === "string"
                ? error
                : null}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
