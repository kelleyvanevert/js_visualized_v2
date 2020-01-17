import React from "react";
import { Range, getTrackBackground } from "react-range";

import theme from "./theme";

export default function StepSlider({ max, value, onValueChange }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        padding: `${0 + 10}px ${21 + 10}px`
      }}
    >
      <Range
        values={[value]}
        step={1}
        min={0}
        max={max}
        onChange={([value]) => onValueChange(value)}
        renderTrack={({ props, children }) => {
          return (
            <div
              onMouseDown={props.onMouseDown}
              onTouchStart={props.onTouchStart}
              style={{
                ...props.style,
                height: "36px",
                display: "flex",
                width: "100%"
              }}
            >
              <div
                ref={props.ref}
                style={{
                  height: "5px",
                  width: "100%",
                  borderRadius: "4px",
                  background: getTrackBackground({
                    values: [value],
                    colors: [theme.primary, "#ccc"],
                    min: 0,
                    max
                  }),
                  alignSelf: "center"
                }}
              >
                {children}
              </div>
            </div>
          );
        }}
        renderThumb={({ props, isDragged }) => {
          return (
            <div
              {...props}
              style={{
                ...props.style,
                height: "42px",
                width: "42px",
                borderRadius: "4px",
                backgroundColor: "#FFF",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0px 2px 6px #AAA"
              }}
            >
              <div
                style={{
                  height: "16px",
                  width: "5px",
                  backgroundColor: isDragged ? theme.primary : "#CCC"
                }}
              />
            </div>
          );
        }}
      />
    </div>
  );
}
