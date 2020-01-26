export default function forceTopLeft(margin = 20) {
  let nodes;

  function force() {
    const max = {
      x: Math.max(...nodes.map(n => n.x)),
      y: Math.max(...nodes.map(n => n.y))
    };

    for (let node of nodes) {
      node.x = Math.max(margin, node.x);
      node.y = Math.max(margin, node.y);

      // TODO make this more intelligent ;)
      node.vx -= node.x / max.x;
      node.vy -= node.y / max.y;
    }
  }

  force.initialize = newNodes => {
    nodes = newNodes;
  };

  return force;
}
