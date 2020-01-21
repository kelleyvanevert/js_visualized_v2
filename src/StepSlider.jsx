import "styled-components/macro";
import React, { useRef, useMemo, useEffect, useState } from "react";
import { Range, getTrackBackground } from "react-range";

import { IoIosArrowDroprightCircle, IoIosCloseCircle } from "react-icons/io";

import format_dt from "./lib/format_dt";

import Spinner from "./Spinner";
import theme from "./theme";

export default function StepSlider({
  max,
  value,
  onValueChange,
  error,
  loading,
  step
}) {
  max = Math.max(1, max);
  value = Math.max(0, Math.min(value, max));

  const btn = useRef(null);

  const at = Math.round(value);

  const thumb = useDelayed(
    useMemo(() => {
      return {
        loading,
        error,
        content: loading ? (
          <Spinner size={32} color={theme.blue} />
        ) : error ? (
          <IoIosCloseCircle size="24px" />
        ) : (
          <>{at || <IoIosArrowDroprightCircle size="24px" />}</>
        )
      };
    }, [loading, error, value]),
    // Directly update the step number, but
    //  defer notification of loading/error state
    //  just a bit for a less haptic feel (while typing)
    loading || error ? 100 : 0
  );

  const focusNow = () => {
    if (btn.current) {
      btn.current.focus();
    }
  };

  return (
    <div
      css={`
        flex-grow: 1;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        padding: 0 22px;
      `}
    >
      <Range
        values={[value]}
        step={0.001}
        min={0}
        max={max}
        onChange={([value]) => {
          focusNow();
          onValueChange(value);
        }}
        renderTrack={({ props, children }) => {
          return (
            <div
              onMouseDown={e => {
                props.onMouseDown(e);
              }}
              onTouchStart={e => {
                props.onTouchStart(e);
              }}
              style={props.style}
              css={`
                height: 44px;
                display: flex;
                width: 100%;
              `}
            >
              <div
                ref={props.ref}
                css={`
                  height: 40px;
                  width: 100%;
                  align-self: center;
                  position: relative;
                `}
              >
                {children}
                <div
                  css={`
                    position: absolute;
                    top: 0;
                    left: -20px;
                    right: -20px;
                    bottom: 0;
                    z-index: 20;
                    border-radius: 4px;
                  `}
                  style={{
                    background: getTrackBackground({
                      values: [value],
                      colors: [
                        thumb.error
                          ? "#c00"
                          : thumb.loading
                          ? "#eee"
                          : theme.blue,
                        "#eee"
                      ],
                      min: 0,
                      max
                    })
                  }}
                />
                {value < 0.1 && (
                  <div
                    css={`
                      z-index: 25;
                      position: absolute;
                      top: 0;
                      bottom: 0;
                      left: 40px;

                      display: flex;
                      align-items: center;

                      font-size: 16px;
                      color: #777;
                    `}
                  >
                    {thumb.loading
                      ? "Loading..."
                      : !thumb.error && "Drag me to start!"}
                  </div>
                )}
              </div>
            </div>
          );
        }}
        renderThumb={({ props }) => {
          return (
            <div
              {...props}
              style={{ ...props.style, zIndex: 30 }}
              onKeyDown={e => {
                if (e.key === "ArrowLeft") {
                  onValueChange(Math.round(value - 1));
                } else if (e.key === "ArrowRight") {
                  onValueChange(Math.round(value + 1));
                }
              }}
            >
              <button
                id="StepSliderThumb"
                autoFocus
                ref={btn}
                css={`
                  display: flex;
                  margin: 0;
                  padding: 0;
                  height: 44px;
                  width: 44px;
                  box-sizing: border-box;

                  position: relative;

                  outline: none;
                  cursor: pointer;
                  border: 2px solid transparent;

                  border-radius: 4px;
                  background-color: #fff;
                  justify-content: center;
                  align-items: center;
                  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.3);

                  &:focus {
                    color: ${theme.blue};
                    border-color: ${theme.blue};
                  }

                  .C {
                    height: 16px;
                    width: 6px;
                    background: #ccc;
                  }

                  font-size: 0.9rem;
                  font-family: Menlo, Consolas, monospace;
                  font-weight: bold;

                  ${thumb.error &&
                    `
                    &,
                    &:focus {
                      color: #c00;
                      border-color: #c00;
                    }
                  `}
                `}
              >
                {thumb.content}
              </button>
              <div css="position: relative;">
                {step && "dt" in step && (
                  <div
                    css={`
                      position: absolute;
                      top: 4px;
                      left: -1rem;
                      right: -1rem;
                      text-align: center;
                      font-size: 14px;
                      white-space: nowrap;
                    `}
                  >
                    {format_dt(step.dt, "@ ")}
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

function useDelayed(stableMostRecent, ms) {
  const [last, set_last] = useState(stableMostRecent);

  useEffect(() => {
    let id = setTimeout(() => {
      set_last(stableMostRecent);
    }, ms);
    return () => clearTimeout(id);
  }, [stableMostRecent]);

  return last;
}
