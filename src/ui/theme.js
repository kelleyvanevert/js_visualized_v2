import color from "color";

const teal = "#4dd4aa";
const blue = "#007cff";
const yellow = "#fbf1a0";

export default {
  // basic
  teal,
  blue,
  yellow,

  // derived
  before: {
    bg: yellow,
    fg: color(yellow)
      .darken(0.4)
      .desaturate(0.1)
      .string()
  },
  after: {
    bg: teal,
    fg: color(teal)
      .darken(0.2)
      .string()
  }
};
