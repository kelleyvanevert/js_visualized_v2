import React, { useState, useMemo, useEffect, useRef } from "react";
import Editor from "react-simple-code-editor";

import StepSlider from "./StepSlider";
import Highlight from "./Highlight";

import theme from "./theme";

import "./App.scss";

const EX = `const a = 16;
const b = 2 + 4;
console.log("a", a, "b", b);
const arr = [a, a + b, b].filter((n, i) => {
  console.log(n, i);
  return n > 5;
});
arr`;

export default function App() {
  const [code, set_code] = useState(EX);
  const [cache, set_cache] = useState({});

  const worker = useReplacableWorker(data => {
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

  const { steps, error, loading } = cache[code] || { loading: true };

  const _lastSteps = useMostRecent(steps, []);

  const [_at, set_at] = useState(0);
  const at = steps
    ? Math.max(0, Math.min(steps.length - 1, Math.round(_at)))
    : 0;
  const step = steps && steps[at];

  return (
    <div className="App">
      <StepSlider
        max={_lastSteps.length - 1}
        value={_at}
        onValueChange={set_at}
        loading={loading}
        error={error}
      />
      <div className="Editor">
        <Editor
          value={code}
          onValueChange={set_code}
          highlight={code => <Highlight code={code} step={step} />}
          padding={24}
          style={{
            fontFamily: "Menlo, Consolas, monospace",
            fontSize: 18,
            lineHeight: 1.4
          }}
          preClassName="language-js"
          textareaClassName="Code"
        />
      </div>
      {step && (
        <div className="InfoPanelGroup">
          <div className="InfoPanel">
            <h2>Step info</h2>
            {step.time && step.category && step.type && (
              <p>
                <em>
                  <strong style={{ color: theme[step.time].fg }}>
                    {step.time === "before"
                      ? `about to ${
                          step.category === "statement" ? "execute" : "evaluate"
                        }`
                      : step.type === "statement"
                      ? "executed"
                      : "evaluated"}
                  </strong>{" "}
                  <u>{step.category}</u> of type
                </em>{" "}
                <strong>{step.type}</strong>{" "}
                {step.time === "after" && step.category === "expression" ? (
                  <em>to:</em>
                ) : (
                  ""
                )}
              </p>
            )}
            {step.time === "after" && step.category === "expression" && (
              <pre>{JSON.stringify(step.value, null, 2)}</pre>
            )}
          </div>
          <div className="InfoPanel">
            <h2>Variables in scope</h2>
            {step.scope &&
              Object.entries(step.scope).map(([variable, [value]], i) => {
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      paddingBottom: 10,
                      ...(i !== 0 && {
                        borderTop: "1px solid #ccc",
                        paddingTop: 10
                      })
                    }}
                  >
                    <pre style={{ margin: "0 8px 0 0" }}>{variable} =</pre>
                    <pre style={{ margin: "0 8px 0 0" }}>
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                );
              })}
          </div>
          <div className="InfoPanel">
            <h2>Console logs</h2>
            {steps
              .slice(0, step.num + 1)
              .map(s => s.logs || [])
              .flat()
              .map((items, i) => {
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      paddingBottom: 10,
                      ...(i !== 0 && {
                        borderTop: "1px solid #ccc",
                        paddingTop: 10
                      })
                    }}
                  >
                    {items.map((item, i) => {
                      return (
                        <pre key={i} style={{ margin: "0 16px 0 0" }}>
                          {JSON.stringify(item, null, 2)}
                        </pre>
                      );
                    })}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function useMostRecent(value, initial) {
  const mostRecentRef = useRef(value || initial);

  if (value) {
    mostRecentRef.current = value;
  }

  return mostRecentRef.current;
}

function _setupWatchDog(info) {
  let id;

  function setTimer() {
    id = setTimeout(() => {
      info.dead = true;
      info.worker.terminate();
      console.log("WORKER DIED :|");
    }, 600);
  }

  info.worker.addEventListener("message", ({ data }) => {
    if ("alive" in data) {
      console.log("still alive", data.alive);
      clearInterval(id);
      setTimer();
    }
  });

  setTimer();
}

function useReplacableWorker(onMessage) {
  const ref = useRef({
    dead: true,
    worker: null,
    spawned: -Infinity
  });

  if (ref.current.dead) {
    ref.current = {
      dead: false,
      worker: new Worker("/worker/index.js"),
      spawned: Date.now()
    };
    _setupWatchDog(ref.current);
  }

  ref.current.worker.onmessage = ({ data }) => {
    if (!("alive" in data)) {
      onMessage(data);
    }
  };

  ref.current.worker.onerror = error => {
    console.log("actual error", error);
  };

  return ref.current.worker;
}
