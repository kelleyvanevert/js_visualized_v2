export default function forceHeapRef() {
  let nodes;

  function force() {
    for (let a of nodes) {
      for (let [key, val] of a.heapObject.entries) {
        if (val.category === "compound") {
          const b = nodes[val.at];
          if (b.x < a.x) {
            b.vx += 0.25;
            a.vx -= 0.25;
          }
          // ref: node.index -> val.at
        }
      }
    }

    // const max = {
    //   x: Math.max(...nodes.map(n => n.x)),
    //   y: Math.max(...nodes.map(n => n.y))
    // };
    // for (let node of nodes) {
    //   node.x = Math.max(margin, node.x);
    //   node.y = Math.max(margin, node.y);
    //   // TODO make this more intelligent ;)
    //   node.vx -= node.x / max.x;
    //   node.vy -= node.y / max.y;
    // }
  }

  force.initialize = newNodes => {
    nodes = newNodes;
  };

  return force;
}
