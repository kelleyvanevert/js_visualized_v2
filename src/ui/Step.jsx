import "styled-components/macro";
import React from "react";
import { ObjectInspector, chromeLight } from "react-inspector";

import format_dt from "../lib/format_dt";
import theme from "./theme";

import Intro from "./Intro";
import Explainer from "./Explainer";

const inspectorTheme = {
  ...chromeLight,
  BASE_FONT_FAMILY: "Menlo, Consolas, monospace",
  BASE_FONT_SIZE: "14px",
  BASE_LINE_HEIGHT: 1.5,
  TREENODE_FONT_FAMILY: "Menlo, Consolas, monospace",
  TREENODE_FONT_SIZE: "14px",
  TREENODE_LINE_HEIGHT: 1.5
};

export default function Step({ step = { category: "init" }, logs = [] }) {
  if (step.category === "init") {
    return (
      <div className="InfoPanelGroup">
        <div className="InfoPanel">
          <Intro />
        </div>
        <div className="InfoPanel">
          <Explainer />
        </div>
      </div>
    );
  } else if (step.category === "wait") {
    return (
      <div
        css={`
          border: 3px solid #eee;
          border-radius: 8px;
          background: #f5f5f5;
          color: #555;
          text-align: center;
          padding: 3rem;
          font-size: 1.25rem;
        `}
      >
        &hellip;not doing anything for ± {format_dt(step.wait)}
      </div>
    );
  } else {
    return (
      <div className="InfoPanelGroup">
        <div className="InfoPanel">
          <h2>Step</h2>
          {step.time && step.category && step.type && (
            <div>
              <p>
                <strong style={{ color: theme[step.time].fg }}>
                  {step.time === "before"
                    ? `about to ${
                        step.category === "expression" ? "evaluate" : "execute"
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
          <h2>Scope</h2>
          {step.scopes &&
            step.scopes.slice().reduce((childrenScopes, scope, j) => {
              const bindings = Object.entries(scope);
              return (
                <div
                  css={`
                    display: inline-block;
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
                  {bindings.map(([variable, value], i) => {
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
          <h2>Console</h2>
          {logs.map((items, i) => {
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
                    <div key={i} css="margin-right: 16px;">
                      <ObjectInspector theme={inspectorTheme} data={item} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
