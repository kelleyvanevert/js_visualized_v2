import React, { useRef } from "react";
import cx from "classnames";
import { Range, getTrackBackground } from "react-range";

import "./StepSlider.scss";

export default function StepSlider({
  max,
  value,
  onValueChange,
  error,
  loading
}) {
  max = Math.max(1, max);
  value = Math.max(0, Math.min(value, max));

  const btn = useRef(null);

  return (
    <div
      className="StepSlider"
      style={{
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        padding: "0 22px"
      }}
    >
      <Range
        values={[value]}
        step={0.001}
        min={0}
        max={max}
        onChange={([value]) => {
          btn.current && btn.current.focus();
          onValueChange(value);
        }}
        // onFinalChange={([value]) => onValueChange(Math.round(value))}
        onMove={() => {
          console.log("onMove");
        }}
        renderTrack={({ props, children }) => {
          return (
            <div
              onMouseDown={e => {
                btn.current && btn.current.focus();
                props.onMouseDown(e);
              }}
              onTouchStart={e => {
                btn.current && btn.current.focus();
                props.onTouchStart(e);
              }}
              style={{
                ...props.style,
                height: 44,
                display: "flex",
                width: "100%"
              }}
            >
              <div
                ref={props.ref}
                style={{
                  height: 6,
                  width: "100%",
                  alignSelf: "center",
                  position: "relative"
                }}
              >
                {children}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: -22,
                    right: -22,
                    bottom: 0,
                    background: getTrackBackground({
                      values: [value],
                      colors: ["#777", "#ddd"],
                      min: 0,
                      max
                    }),
                    zIndex: 20,
                    borderRadius: "4px"
                  }}
                />
              </div>
            </div>
          );
        }}
        renderThumb={({ props, isDragged }) => {
          return (
            <button
              {...props}
              ref={btn}
              className={cx(
                "Thumb",
                isDragged && "state-dragged",
                error && "state-error",
                loading && "state-loading"
              )}
              style={{ ...props.style, zIndex: 30 }}
              onKeyDown={e => {
                if (e.key === "ArrowLeft") {
                  onValueChange(value - 1);
                } else if (e.key === "ArrowRight") {
                  onValueChange(value + 1);
                }
              }}
            >
              {loading ? "..." : error ? "ERR" : Math.round(value)}
            </button>
          );
        }}
      />
    </div>
  );
}
