import "styled-components/macro";
import React, { useState, useMemo, useEffect, useRef } from "react";
import Editor from "react-simple-code-editor";
import { ObjectInspector, chromeLight } from "react-inspector";
import stripIndent from "common-tags/lib/stripIndent";

import { undescribe } from "./lib/describe";

import StepSlider from "./StepSlider";
import Highlight from "./Highlight";
import Menu from "./Menu";

import Intro from "./content/Intro";
import Explainer from "./content/Explainer";

import theme from "./theme";

import "./App.scss";

const inspectorTheme = {
  ...chromeLight,
  BASE_FONT_FAMILY: "Menlo, Consolas, monospace",
  BASE_FONT_SIZE: "14px",
  BASE_LINE_HEIGHT: 1.5,
  TREENODE_FONT_FAMILY: "Menlo, Consolas, monospace",
  TREENODE_FONT_SIZE: "14px",
  TREENODE_LINE_HEIGHT: 1.5
};

const PRESETS = {
  "Averaging grades": stripIndent`
    const grades = [4, 8.1, 2.5, 9, 7.8];

    function sum(total, grade) {
      console.log(total, grade);
      return total + grade;
    }

    const avg = grades.reduce(sum, 0) / grades.length;
  `,
  "For-loop": stripIndent`
    for (let i = 0; i < 5; i = i + 1) {
      console.log("at iteration", i);
    }
  `,
  "While-loop": stripIndent`
    let i = 0;
    while (i < 5) {
      console.log("at iteration", i);
      i = i + 1;
    }
  `,
  IIFE: stripIndent`
    (function () {
      let x = 1;
    }());
  `
};

function _cacheKey(code, config = {}) {
  return (config.detail ? "Y" : "N") + ";" + code;
}

export default function App() {
  const [cache, set_cache] = useState({});

  const [code, set_code] = useState(PRESETS["Averaging grades"]);
  const [detail, set_detail] = useState(true);

  const worker = useReplacableWorker(data => {
    if (data.steps) {
      data.steps = undescribe(data.steps);
    }
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

  const delayed = useDelayed(
    useMemo(() => {
      return {
        loading,
        error
      };
    }, [loading, error]),
    100
  );

  const _lastSteps = useMostRecent(steps, []);

  const [_at, set_at] = useState(0);
  const at = steps
    ? Math.max(0, Math.min(steps.length - 1, Math.round(_at)))
    : 0;
  const step = steps && steps[at];

  const [menuOpen, set_menuOpen] = useState(false);

  return (
    <div className="App">
      <div
        css={`
          display: flex;
          align-items: center;
        `}
      >
        <Menu
          isOpen={menuOpen}
          onOpenChange={set_menuOpen}
          css={`
            margin-right: 1rem;
          `}
        >
          <div css="padding: 1rem;">
            {/* <p css="margin-top: 0;">
              <label>
                <input
                  type="checkbox"
                  checked={detail}
                  onChange={e => set_detail(e.target.checked)}
                  css={`
                    margin-right: 1rem;
                  `}
                />
                Expression level detail
              </label>
            </p> */}
            <h3 css="margin: 0 0 0.5rem 0;">Presets</h3>
            <ul
              css={`
                margin: 0 -1rem;
                padding: 0;

                li {
                  display: block;
                  margin: 0;
                  padding: 0;
                }

                button {
                  display: block;
                  box-sizing: border-box;
                  width: 100%;
                  border: 2px solid transparent;
                  background: none;
                  margin: 0;
                  padding: 0.5rem 1rem;

                  text-align: left;
                  font-family: "Work Sans", sans-serif;
                  font-size: 1rem;

                  cursor: pointer;
                  outline: none;

                  &:hover,
                  &:focus {
                    background: #eee;
                  }
                  &:active {
                    background: ${theme.blue};
                    color: white;
                  }
                }
              `}
            >
              {Object.entries(PRESETS).map(([title, code]) => {
                return (
                  <li key={title}>
                    <button
                      onClick={() => {
                        set_code(code);
                        set_at(0);
                        set_menuOpen(false);
                        const btn = document.getElementById("StepSliderThumb");
                        btn && btn.focus();
                      }}
                    >
                      {title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Menu>
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
            lineHeight: 1.5
          }}
          preClassName="language-js"
          textareaClassName="Code"
        />
      </div>
      {step && at > 0 && (
        <div className="InfoPanelGroup">
          <div className="InfoPanel">
            <h2>Step info</h2>
            {step.time && step.category && step.type && (
              <div>
                <p>
                  <strong style={{ color: theme[step.time].fg }}>
                    {step.time === "before"
                      ? `about to ${
                          step.category === "expression"
                            ? "evaluate"
                            : "execute"
                        }`
                      : step.type === "statement"
                      ? "executed"
                      : "evaluated"}
                  </strong>{" "}
                  {step.category}
                  <br />
                  <span css="margin-left: 10px;">
                    (of type <strong>{step.type}</strong>)
                  </span>
                </p>
                {step.time === "after" && step.category === "expression" && (
                  <p>&hellip;to the value:</p>
                )}
              </div>
            )}
            {step.time === "after" && step.category === "expression" && (
              <ObjectInspector
                theme={{
                  ...inspectorTheme,
                  BASE_FONT_SIZE: "20px",
                  TREENODE_FONT_SIZE: "20px"
                }}
                data={step.value}
              />
            )}
          </div>
          <div className="InfoPanel">
            <h2>Variables in scope</h2>
            {step.scopes &&
              step.scopes.slice().reduce((childrenScopes, scope, j) => {
                const bindings = Object.entries(scope);
                return (
                  <div
                    css={`
                      margin-top: 10px;
                      border: 2px solid ${j === 0 ? "black" : "#ccc"};
                      ${j === 0 && "box-shadow: 0 2px 6px rgba(0, 0, 0, .2);"}
                      padding: 10px;
                      border-radius: 4px;
                    `}
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
                          <ObjectInspector
                            theme={inspectorTheme}
                            name={variable}
                            data={value}
                          />
                        </div>
                      );
                    })}
                    {childrenScopes}
                  </div>
                );
              }, <div />)}
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
                        borderTop: "2px solid #ccc",
                        paddingTop: 10
                      })
                    }}
                  >
                    {items.map((item, i) => {
                      return (
                        <div css="margin-right: 16px;">
                          <ObjectInspector theme={inspectorTheme} data={item} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {at < 0.1 && !delayed.error && (
        <div className="InfoPanelGroup">
          <div className="InfoPanel">
            <Intro />
          </div>
          <div className="InfoPanel">
            <Explainer />
          </div>
        </div>
      )}
      {delayed.error && (
        <div className="InfoPanelGroup">
          <div className="InfoPanel">
            <h2 css="color: #c00;">Uh oh!</h2>
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

  // Only automatically start watching after we've
  //  succesfully spawned at least 1 worker,
  //  because the first spawn will take considerably
  //  longer due to the network request involved
  !info.first && setTimer();
}

function useReplacableWorker(onMessage) {
  const ref = useRef();

  if (!ref.current || ref.current.dead) {
    ref.current = {
      first: !ref.current,
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
    console.log("actual error in worker", error);
  };

  return ref.current.worker;
}

function useDelayed(stableMostRecent, ms) {
  const [last, set_last] = useState(stableMostRecent);

  useEffect(() => {
    let id = setTimeout(() => {
      set_last(stableMostRecent);
    }, ms);
    return () => clearTimeout(id);
  }, [stableMostRecent]);

  return last;
}
