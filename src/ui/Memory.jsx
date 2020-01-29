import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import ELK from "elkjs/lib/elk.bundled.js";

import theme from "./theme";

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

  const [graph, set_graph] = useState();

  const layout = useRef({
    heapObjectDomNodes: [],
    graph: {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.layered.feedbackEdges": true,
        "elk.edgeRouting": "SPLINES",
        "elk.direction": "RIGHT",
        // "org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers": 40,
        "org.eclipse.elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        "org.eclipse.elk.layered.wrapping.strategy": "MULTI_EDGE",
        "org.eclipse.elk.layered.wrapping.correctionFactor": 100
        // "org.eclipse.elk.layered.edgeRouting.splines.mode": "SLOPPY",
        // "org.eclipse.elk.layered.edgeRouting.splines.sloppy.layerSpacingFactor": 0.9
        // hierarchyHandling: "INCLUDE_CHILDREN"
      },
      children: [],
      edges: []
    },
    elk: new ELK(),
    cycle: 0,
    async redraw(heap) {
      console.log("redraw", heap);
      const myCycle = ++this.cycle;

      this.graph.children = this.heapObjectDomNodes.map((node, i) => {
        const { width, height } = node.getBoundingClientRect();
        const ports = heap[i].entries
          .map(([key, val]) => {
            if (val.category === "compound") {
              const id = `${i}-${key}`;
              return {
                id
                // properties: {
                //   "org.eclipse.elk.port.side": "SIDES_NORTH_EAST"
                // }
              };
            }
          })
          .filter(Boolean);
        return { id: i, width, height, ports, labels: [{ text: "hello" }] };
      });

      this.graph.edges = heap
        .map((obj, i) => {
          return obj.entries
            .map(([key, val]) => {
              if (val.category === "compound") {
                const id = `${i}-${key}-${val.at}`;
                return {
                  id,
                  source: i,
                  sourcePort: `${i}-${key}`,
                  target: val.at
                };
              }
            })
            .filter(Boolean);
        })
        .flat();

      await this.elk.layout(this.graph);

      if (this.cycle !== myCycle) {
        console.warn("invalidated");
        return;
      }

      console.log("TODO");
      set_graph({ ...this.graph });
    }
  }).current;

  useEffect(() => {
    layout.redraw(heap);
  }, [heap]);

  console.log("render", graph);

  return (
    <div
      ref={el => {
        if (el) {
          layout.container = el;
          // !graph && computeLayout();
        }
      }}
      style={{ width, height, position: "relative", background: "#eee" }}
    >
      {heap.map((obj, i) => {
        const graphNode = graph && graph.children && graph.children[i];

        return (
          <div
            key={i}
            ref={el => {
              if (el) {
                layout.heapObjectDomNodes[i] = el;
              }
            }}
            style={{
              position: "absolute",
              top: graphNode ? graphNode.y : undefined,
              left: graphNode ? graphNode.x : undefined
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
      >
        <g strokeWidth={2} stroke="black" fill="none">
          {graph &&
            graph.edges.map(edge => {
              return edge.sections.map(section => {
                const {
                  id,
                  startPoint: a,
                  endPoint: b,
                  bendPoints: [c1, c2]
                } = section;
                // return <path key={id} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} />;
                return (
                  <path
                    key={id}
                    d={`M${a.x} ${a.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`}
                  />
                );
              });
            })}
        </g>
      </svg>
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
