export default function format_dt(dt, prepend = "") {
  if (dt < 2) {
    return;
  } else if (dt < 1000) {
    return `${prepend}${dt} ms`;
  } else {
    return `${prepend}${Math.round(dt / 100) / 10} s`;
  }
}
