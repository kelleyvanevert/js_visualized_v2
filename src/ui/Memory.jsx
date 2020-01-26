import React, { useRef, useLayoutEffect, useState } from "react";
import * as d3 from "d3-force";

import theme from "./theme";

import forceTopLeft from "./memory/forceTopLeft";
import forceRectCollide from "./memory/forceRectCollide";
import forceHeapRef from "./memory/forceHeapRef";
/*

type Node =
  | {
      category: "primitive";
      type: "number" | "string" | "boolean" | "null" | "undefined";
      value: any;
    }
  | {
      category: "primitive";
      type: "symbol";
      str: string; // e.g. "Symbol(hello)"
    }
  | {
      category: "compound";
      at: number; // location in heap
    }

type Obj = { entries: Array<[string, Node]> } &
  (   { type: "array"; length: number; }
    | { type: "function"; }
    | { type: "promise"; }
    | { type: "object"; cname: string;  }
  )

type Heap = Obj[];

*/

export default function Memory({ node, heap }) {
  const width = 800;
  const height = 400;

  const layout = useRef({
    simulation: null,
    simNodes: [],
    heapObjectDomNodes: [],
    restart() {
      if (!this.simulation) return;

      this.simulation
        .nodes(this.simNodes)
        .alpha(1)
        .restart();
    }
  }).current;

  useLayoutEffect(() => {
    // Make sure there is the right amount of simulation nodes,
    //  on for each heap object -- without removing previous ones
    layout.simNodes = layout.simNodes
      .slice(0, heap.length)
      .concat(heap.slice(layout.simNodes.length).map(() => ({ vx: 0, vy: 0 })));

    layout.simNodes.forEach((simNode, i) => {
      simNode.heapObject = heap[i];
    });

    // Make some heuristics calculations
    // ...?

    layout.restart();
  }, [heap]);

  useLayoutEffect(() => {
    function ticked() {
      console.log("tick");
      layout.heapObjectDomNodes.forEach((domNode, i) => {
        if (!domNode) return;

        domNode.style.left = `${layout.simNodes[i].x}px`;
        domNode.style.top = `${layout.simNodes[i].y}px`;
      });
    }

    layout.simulation = d3
      .forceSimulation(layout.simNodes)
      .force("place_top_left", forceTopLeft())
      .force(
        "avoid_collisions",
        forceRectCollide().size(node => {
          const rect = layout.heapObjectDomNodes[
            node.index
          ].getBoundingClientRect();
          return [rect.width + 20, rect.height + 20];
        })
      )
      .force("heap_references", forceHeapRef())
      .on("tick", ticked);
  }, []);

  const [drag, set_drag] = useState();

  return (
    <div
      ref={el => (layout.container = el)}
      style={{ width, height, position: "relative", background: "#eee" }}
      onMouseMove={e => {
        if (!drag) return;
        const { i, initial } = drag;

        const simNode = layout.simNodes[i];
        simNode.vx = simNode.vy = 0;

        const dx = e.pageX - initial.e.pageX;
        const dy = e.pageY - initial.e.pageY;
        simNode.fx = simNode.x = initial.simNode.x + dx;
        simNode.fy = simNode.y = initial.simNode.y + dy;

        const domNode = layout.heapObjectDomNodes[i];
        domNode.style.left = `${simNode.fx}px`;
        domNode.style.top = `${simNode.fy}px`;

        e.stopPropagation();
        e.preventDefault();
      }}
      onMouseUp={e => {
        if (!drag) return;
        const { i } = drag;

        const simNode = layout.simNodes[i];
        delete simNode.fx;
        delete simNode.fy;

        set_drag(undefined);
        layout.restart();

        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {heap.map((obj, i) => {
        return (
          <div
            key={i}
            ref={el => (layout.heapObjectDomNodes[i] = el)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              cursor: "pointer",
              userSelect: "none"
            }}
            onMouseDown={e => {
              if (e.button !== 0) return;

              const simNode = layout.simNodes[i];
              simNode.fx = simNode.x;
              simNode.fy = simNode.y;
              const newDragState = {
                i,
                initial: {
                  simNode: { ...simNode },
                  e: {
                    pageX: e.pageX,
                    pageY: e.pageY
                  }
                }
              };
              set_drag(newDragState);

              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <HeapObject {...obj} />
          </div>
        );
      })}
      <svg
        style={{
          width,
          height,
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none"
        }}
      ></svg>
    </div>
  );
}

const fontFamily = "Menlo, Consolas, monospace";
const fontSize = 14;

function HeapObject({ entries, type, length, cname }) {
  return (
    <div
      className="HeapObject"
      style={{
        fontFamily,
        fontSize,
        display: "inline-flex",
        flexDirection: "column",
        border: `2px solid ${theme.border}`,
        borderRadius: type === "array" ? 0 : 16,
        boxShadow: "0 2px 6px rgba(0, 0, 0, .2)",
        background: "white",
        minHeight: 18,
        minWidth: 18
      }}
    >
      {entries.map(([key, node], i) => {
        return (
          <div
            key={key}
            style={{
              padding: "4px 8px",
              borderTop:
                i > 0 && type === "array" && `1px solid ${theme.border}`
            }}
          >
            {!(type === "array" && key >= 0 && key < length) && (
              <span style={{ marginRight: 8 }}>
                <span
                  style={{
                    color: theme.syntax.key
                  }}
                >
                  {key}
                </span>
                :
              </span>
            )}
            {node.category === "primitive" ? (
              <Primitive {...node} />
            ) : (
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: "black"
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Primitive({ type, value }) {
  return (
    <span style={{ color: theme.syntax[type], fontFamily, fontSize }}>
      {type === "string"
        ? `"${value}"`
        : type === "null"
        ? `null`
        : type === "undefined"
        ? `undefined`
        : type === "boolean"
        ? value + ""
        : value}
    </span>
  );
}
