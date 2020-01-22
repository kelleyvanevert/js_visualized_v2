// Quite high, I know.
// But sometimes there's gaps up to 5 ms in regular synchronous code :|
// Somehow due to my worker setup?
// Still way better to have false negatives (asynchronous code waiting steps
//  that don't show up in the UI, as is usual anyway for 0 ms waits),
//  than false positives (synchronous code that display as waiting steps,
//  this can be very confusing).
const MIN = 20;

export default function add_waiting_time_steps(steps) {
  for (let i = 0; i < steps.length - 1; i++) {
    if (
      "dt" in steps[i] &&
      "dt" in steps[i + 1] &&
      steps[i + 1].dt - steps[i].dt >= MIN
    ) {
      steps.splice(i + 1, 0, {
        category: "wait",
        wait: steps[i + 1].dt - steps[i].dt
      });
    }
  }
}
