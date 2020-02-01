import React from "react";

export const CH = 16; // char height
export const R = 0.6; // char width/height for "Menlo"
export const CW = R * CH; // char width

export const PY = 8;
export const PX = 8;

function renderKey(key) {
  const S = 0.85;

  return [
    CW * S * (2 + key.length),
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
  ];
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
      id,
      height: CH,
      width
    };

    graphNode._jsx = (
      <text
        className={`node cat-primitive type-${type}`}
        dominantBaseline="hanging"
        lengthAdjust="spacingAndGlyphs"
        textLength={width}
        dy={CH / 8}
      >
        {valueStr}
      </text>
    );

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

    const jsxPieces = [];

    const obj = heap[at];

    const p = { top: 50, right: 40, bottom: 40, left: 80 };

    for (const [key, childNode] of obj.entries) {
      const [keyWidth, keyEl] = renderKey(key);
      const [childGraphNode] = renderNode(
        [childNode, heap],
        `${id}-${key}`,
        done,
        rootNode
      );
      jsxPieces.push(
        <g key={`${key}-key`} transform={`translate(0, ${graphNode.height})`}>
          {keyEl}
        </g>
      );
      jsxPieces.push(
        <g
          key={`${key}-val`}
          transform={`translate(${keyWidth}, ${graphNode.height})`}
        >
          {childGraphNode._jsx}
        </g>
      );
      graphNode.height += childGraphNode.height + PY;
      graphNode.width = Math.max(
        graphNode.width,
        keyWidth + childGraphNode.width
      );

      if (childGraphNode._isRef) {
        graphNode.children.push(childGraphNode);
      }
    }

    graphNode.layoutOptions = {
      "elk.padding": `[top=${p.top},left=${p.left},bottom=${p.bottom},right=${p.right}]`
    };

    graphNode.width += 2 * PX;

    graphNode._jsx = (
      <g className="node cat-compound">
        <rect
          width={graphNode.width}
          height={graphNode.height}
          fill="white"
          stroke="black"
          strokeWidth={2}
          rx={8}
        />
        <g transform={`translate(${PX}, 0)`}>{jsxPieces}</g>
      </g>
    );

    if (id === "value") {
      return [graphNode, rootNode];
    }
  }

  const refGraphNode = {
    id: `REF:${id}`,
    width: 12,
    height: CH,
    _isRef: true
  };

  // rootNode.children.push(refGraphNode);
  rootNode.children.push(graphNode);

  rootNode.edges.push({
    id: `LINK:${id}`,
    source: `REF:${id}`,
    target: id
  });

  refGraphNode._jsx = (
    <g transform={`translate(6, ${CH / 2})`}>
      <circle r={6} stroke="none" fill="black" />
    </g>
  );

  return [refGraphNode];
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
