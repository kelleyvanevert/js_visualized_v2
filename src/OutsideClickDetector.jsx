import React, { useRef, useEffect, useCallback } from "react";

export default function OutsideClickDetector({
  onInsideClick = () => {},
  onOutsideClick = () => {},
  onEscapeKey = () => {},
  ...divProps
}) {
  const nodeRef = useRef(null);

  const keydownHandler = useCallback(
    e => {
      if (e.keyCode === 27 && onEscapeKey) {
        onEscapeKey(e);
      }
    },
    [onEscapeKey]
  );

  useEffect(() => {
    document.addEventListener("keydown", keydownHandler, false);
    return () => document.removeEventListener("keydown", keydownHandler, false);
  }, [keydownHandler]);

  useEffect(() => {
    const handleClick = e => {
      const { current: node } = nodeRef;
      if (node && node.contains(e.target)) {
        onInsideClick(e);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onInsideClick]);

  useEffect(() => {
    const handleClick = e => {
      const { current: node } = nodeRef;
      if (node && !node.contains(e.target)) {
        onOutsideClick(e);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onOutsideClick]);

  useEffect(() => {
    const handleClick = e => {
      const { current: node } = nodeRef;
      if (node && !node.contains(e.target)) {
        onOutsideClick(e);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onOutsideClick]);

  return <div {...divProps} ref={nodeRef} />;
}
