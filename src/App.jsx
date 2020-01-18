import "styled-components/macro";
import React, { useState, useEffect, useRef } from "react";
import Editor from "react-simple-code-editor";

import StepSlider from "./StepSlider";
import Highlight from "./Highlight";

import theme from "./theme";

import "./App.scss";

const EX = `const grades = [4, 8.1, 2.5, 9, 7.8];
console.log("grades", grades);
const total = grades.reduce((total, grade) => {
  return total + grade;
}, 0);
console.log("total", total);
const avg = total / grades.length;
console.log("avg", avg);`;

function _cacheKey(code, config = {}) {
  return (config.detail ? "Y" : "N") + ";" + code;
}

export default function App() {
  const [cache, set_cache] = useState({});

  const [code, set_code] = useState(EX);
  const [detail, set_detail] = useState(true);

  const worker = useReplacableWorker(data => {
    set_cache(cache => {
      return {
        ...cache,
        [_cacheKey(data.code, data.config)]: data
      };
    });
  });

  useEffect(() => {
    if (worker && !cache[_cacheKey(code, { detail })]) {
      worker.postMessage({ code, config: { detail } });
    }
  }, [code, detail, cache, worker]);

  const cacheKey = _cacheKey(code, { detail });
  const { steps, error, loading } = cache[cacheKey] || { loading: true };

  const _lastSteps = useMostRecent(steps, []);

  const [_at, set_at] = useState(0);
  const at = steps
    ? Math.max(0, Math.min(steps.length - 1, Math.round(_at)))
    : 0;
  const step = steps && steps[at];

  return (
    <div className="App">
      <div
        css={`
          display: flex;
          align-items: center;
        `}
      >
        <input
          type="checkbox"
          checked={detail}
          onChange={e => set_detail(e.target.checked)}
          css={`
            margin-right: 16px;
          `}
        />
        <StepSlider
          max={_lastSteps.length - 1}
          value={_at}
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
            {step.scopes &&
              step.scopes
                .slice()
                .reverse()
                .map((scope, j) => {
                  const bindings = Object.entries(scope);
                  return (
                    <div
                      key={j}
                      style={{
                        borderTop: "2px solid black",
                        paddingTop: 10,
                        marginLeft: 10 * j,
                        paddingLeft: 10,
                        borderLeft: "2px solid black",
                        paddingBottom: 10
                      }}
                    >
                      {bindings.length === 0 && (
                        <p css="margin: 0;">
                          <em>(no variables in this scope)</em>
                        </p>
                      )}
                      {bindings.map(([variable, [value]], i) => {
                        return (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              paddingBottom: i === bindings.length - 1 ? 0 : 10
                            }}
                          >
                            <pre style={{ margin: "0 8px 0 0" }}>
                              {variable} =
                            </pre>
                            <pre style={{ margin: "0 8px 0 0" }}>
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          </div>
                        );
                      })}
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
