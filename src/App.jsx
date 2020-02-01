import "styled-components/macro";
import React, { useState, useEffect } from "react";
import { hot } from "react-hot-loader";

import ELK from "elkjs/lib/elk.bundled.js";

import { describe } from "./lib/describe";

import { renderNode, CH } from "./memory";
import "./memory/style";

import "./App.scss";

function App() {
  const [graph, set_graph] = useState();

  useEffect(() => {
    const value = {
      name: "Kelley",
      age: 27,
      hobbies: ["Playing piano", "having fun", 3.14]
    };

    const [graphNode, rootNode] = renderNode(describe(value));

    rootNode.children.unshift(graphNode);

    // const rootNode = {
    //   children: [
    //     {
    //       id: "a",
    //       width: 100,
    //       height: 100,
    //       children: [
    //         {
    //           id: "a-sub",
    //           width: 25,
    //           height: 25
    //         }
    //       ],
    //       layoutOptions: {
    //         "elk.padding": "[top=10,left=10,bottom=100,right=50]"
    //       }
    //     },
    //     {
    //       id: "b",
    //       width: 100,
    //       height: 100
    //     }
    //   ],
    //   edges: [
    //     {
    //       id: "a -> b",
    //       source: "a-sub",
    //       target: "b"
    //     }
    //   ]
    // };

    const graph = {
      ...rootNode,
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.layered.feedbackEdges": true,
        "elk.edgeRouting": "SPLINES",
        "elk.direction": "RIGHT",
        // "org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers": 40,
        "org.eclipse.elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        "org.eclipse.elk.layered.wrapping.strategy": "MULTI_EDGE",
        "org.eclipse.elk.layered.wrapping.correctionFactor": 100,
        // "org.eclipse.elk.layered.edgeRouting.splines.mode": "SLOPPY",
        // "org.eclipse.elk.layered.edgeRouting.splines.sloppy.layerSpacingFactor": 0.9
        hierarchyHandling: "INCLUDE_CHILDREN",
        "org.eclipse.elk.nodeSize.options": "[DEFAULT_MINIMUM_SIZE]"
      }
    };

    console.log(graph);

    const elk = new ELK();

    elk.layout(graph).then(() => {
      console.log("DONE");
      set_graph(graph);
    });
  }, []);

  if (!graph) {
    return (
      <div className="App">
        <p>Layouting...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <svg
        style={{
          width: graph.width,
          height: graph.height,
          fontFamily: "Menlo",
          fontSize: CH
        }}
      >
        <rect
          x={0}
          y={0}
          width={graph.width}
          height={graph.height}
          fill="#eee"
        />
        {graph.children.map(child => {
          return (
            <g key={child.id} transform={`translate(${child.x}, ${child.y})`}>
              {child._jsx || (
                <rect
                  width={child.width}
                  height={child.height}
                  fill="none"
                  stroke="black"
                  strokeWidth={1}
                />
              )}
              {child.children &&
                child.children.map(grandchild => {
                  return (
                    <g
                      key={grandchild.id}
                      transform={`translate(${grandchild.x}, ${grandchild.y})`}
                    >
                      {grandchild._jsx || (
                        <rect
                          width={grandchild.width}
                          height={grandchild.height}
                          fill="none"
                          stroke="black"
                          strokeWidth={1}
                        />
                      )}
                    </g>
                  );
                })}
            </g>
          );
        })}
        <g strokeWidth={2} stroke="black" fill="none">
          {graph.edges.map(edge => {
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

  // return (
  //   <div className="App">
  //     <div
  //       css={`
  //         display: flex;
  //         flex-wrap: wrap;
  //       `}
  //     >
  //       {[
  //         // "Kelley",
  //         // 42,
  //         // 1.23e8,
  //         // 0.0001,
  //         // true,
  //         // false,
  //         // undefined,
  //         // null,
  //         // Symbol(),
  //         // Symbol("hello"),
  //         // `Whatever will be\nwill be`,
  //         {
  //           name: "Kelley",
  //           age: 27,
  //           hobbies: ["Playing piano", "having fun", 3.14]
  //         }
  //         // { a: {} },
  //         // ["Playing piano", "having fun", 3.14]
  //       ]
  //         .map(v => describe(v))
  //         .map(description => {
  //           const r = renderNode(description);
  //           console.log(r);

  //           const [graphNode, el, rootNode] = r;

  //           return (
  //             <div
  //               css={`
  //                 margin: 1rem 1rem 0 0;
  //               `}
  //             >
  //               <svg
  //                 style={{
  //                   width: graphNode.width + 20,
  //                   height: graphNode.height + 20,
  //                   fontFamily: "Menlo",
  //                   fontSize: CH
  //                 }}
  //                 viewBox={`-10 -10 ${graphNode.width + 20} ${graphNode.height +
  //                   20}`}
  //               >
  //                 <rect
  //                   x={0}
  //                   y={0}
  //                   width={graphNode.width}
  //                   height={graphNode.height}
  //                   fill="none"
  //                 />
  //                 {el}
  //               </svg>
  //             </div>
  //           );
  //         })}
  //     </div>
  //   </div>
  // );
}

const wrap = process.env.NODE_ENV === "development" ? hot(module) : x => x;

export default wrap(App);
