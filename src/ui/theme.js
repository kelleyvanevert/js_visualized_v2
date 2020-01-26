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
  },
  border: "#555",

  // syntax
  syntax: {
    variable: "#881391",
    key: "#881391",
    string: "#c41a16",
    number: "#1c00cf",
    boolean: "#1c00cf",
    null: "#808080",
    undefined: "#808080"
  }
};
