import React from "react";

export const CH = 16; // char height
export const R = 0.6; // char width/height for "Menlo"
export const CW = R * CH; // char width

export const PY = 10;
export const PX = 10;

function keyWidth(key) {
  const S = 0.85;
  return CW * S * (2 + key.length);
}

function renderKey(key) {
  const S = 0.85;
  return (
    <text
      className={`node cat-key`}
      dominantBaseline="hanging"
      lengthAdjust="spacingAndGlyphs"
      textLength={CW * S * (1 + key.length)}
      fontSize={CH * S}
      dy={CH / 8 + (CH * (1 - S)) / 2}
    >
      {key}:
    </text>
  );
}

// Usage:
// [graphNode, rootNode] = renderNode(description = [node, heap], id, done, rootNode)
export function renderNode(
  [{ category, type, value, str, at }, heap],
  id = "value",
  done = [],
  rootNode = {
    children: [],
    edges: []
  }
) {
  if (category === "primitive") {
    const valueStr =
      type === "string"
        ? `"${value}"`
        : type === "symbol"
        ? str
        : String(value);

    const width = CW * valueStr.length;

    const graphNode = {
      category,
      type,
      id,
      height: CH,
      width,
      valueStr,
      layoutOptions: {
        // "org.eclipse.elk.layered.contentAlignment": "H_LEFT"
        "elk.alignment": "LEFT"
      }
    };

    return [graphNode, rootNode];
  }

  const graphNode = done[at] || {
    id,
    width: 0,
    height: PY,
    children: []
  };

  if (!done[at]) {
    done[at] = graphNode;

    const obj = heap[at];

    const p = { top: PY, right: PX, bottom: PY, left: PX };

    let maxWidth = 0;

    for (const [key, childNode] of obj.entries) {
      const [childGraphNode] = renderNode(
        [childNode, heap],
        `${id}-${key}`,
        done,
        rootNode
      );

      childGraphNode.prependKey = key;
      childGraphNode.width += keyWidth(key);

      // if (key.match(/^[0-9]+$/)) {
      //   childGraphNode.layoutOptions["elk.processingOrder"] = parseInt(key);
      // }

      graphNode.children.push(childGraphNode);
      maxWidth = Math.max(maxWidth, childGraphNode.width);
    }

    graphNode.children.forEach(childGraphNode => {
      if (childGraphNode.isRef) {
        // console.log(childGraphNode.width, maxWidth);
        childGraphNode.width = maxWidth;
      }
    });

    graphNode.layoutOptions = {
      "org.eclipse.elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      // "elk.alignment": "LEFT",
      // "org.eclipse.elk.layered.contentAlignment": "[H_LEFT]",
      // "org.eclipse.elk.layered.nodePlacement.bk.fixedAlignment": "LEFTUP",
      "elk.padding": `[top=${p.top},left=${p.left},bottom=${p.bottom},right=${p.right}]`,
      "org.eclipse.elk.spacing.nodeNode": PY
    };

    if (id === "value") {
      return [graphNode, rootNode];
    }
  }

  const refGraphNode = {
    id: `REF:${id}`,
    width: 12,
    height: CH,
    isRef: true,
    layoutOptions: {}
  };

  // rootNode.children.push(refGraphNode);
  rootNode.children.push(graphNode);

  rootNode.edges.push({
    id: `LINK:${id}`,
    source: `REF:${id}`,
    target: id
  });

  return [refGraphNode];
}

export function GraphNode(props) {
  const {
    x,
    y,
    isRef,
    category,
    type,
    width,
    height,
    valueStr,
    children,
    prependKey
  } = props;

  const actualWidth = prependKey ? width - keyWidth(prependKey) : width;

  const x0 = prependKey ? keyWidth(prependKey) : 0;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {prependKey && renderKey(prependKey)}
      {category === "primitive" ? (
        <text
          className={`node cat-primitive type-${type}`}
          dominantBaseline="hanging"
          lengthAdjust="spacingAndGlyphs"
          textLength={actualWidth}
          dy={CH / 8}
          x={x0}
        >
          {valueStr}
        </text>
      ) : isRef ? (
        <g>
          <circle r={6} cx={x0 + 6} cy={CH / 2} stroke="none" fill="black" />
          <path
            stroke="black"
            strokeWidth={2}
            fill="none"
            d={`M${x0 + 6}, ${CH / 2} L${width}, ${CH / 2}`}
          />
        </g>
      ) : (
        <g>
          <rect
            width={width}
            height={height}
            fill="white"
            stroke="black"
            strokeWidth={2}
            rx={8}
          />
          {children &&
            children.map(child => {
              return <GraphNode key={child.id} {...child} />;
            })}
        </g>
      )}
    </g>
  );
}

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
