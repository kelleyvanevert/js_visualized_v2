import { useRef } from "react";

export default function useReplacableWorker(onMessage) {
  const ref = useRef();

  if (!ref.current || ref.current.dead) {
    ref.current = {
      first: !ref.current,
      dead: false,
      worker: new Worker("/worker/index.js"),
      spawned: Date.now()
    };
    setupWatchDog(ref.current);
  }

  ref.current.worker.onmessage = ({ data }) => {
    if (!("alive" in data)) {
      onMessage(data);
    }
  };

  ref.current.worker.onerror = error => {
    console.info("actual error in worker", error);
  };

  return ref.current.worker;
}

function setupWatchDog(info) {
  let id;

  function setTimer() {
    id = setTimeout(() => {
      info.dead = true;
      info.worker.terminate();
      console.info("WORKER DIED :|");
    }, 600);
  }

  info.worker.addEventListener("message", ({ data }) => {
    if ("alive" in data) {
      console.info("still alive", data.alive);
      clearInterval(id);
      setTimer();
    }
  });

  // Only automatically start watching after we've
  //  succesfully spawned at least 1 worker,
  //  because the first spawn will take considerably
  //  longer due to the network request involved
  !info.first && setTimer();
}
