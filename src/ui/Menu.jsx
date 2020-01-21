import "styled-components/macro";
import React, { useState, useRef } from "react";
import { useClickAway } from "react-use";

import theme from "./theme";

export default function Menu({ items, onSelect, ...props }) {
  const [open, set_open] = useState(false);
  const close = () => set_open(false);

  const ref = useRef(null);
  useClickAway(ref, close);

  return (
    <div {...props} ref={ref}>
      <button
        onClick={() => set_open(open => !open)}
        css={`
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin: 0;
          padding: 0;

          width: 44px;
          height: 44px;
          background: none;
          border: 2px solid transparent;
          border-radius: 4px;

          cursor: pointer;
          outline: none;

          &:focus {
            background: #eee;
          }

          .center {
            display: block;
            position: relative;

            span {
              display: block;
              position: absolute;
              background: black;
              height: 3px;
              top: -1.5px;
              width: 20px;
              left: -10px;

              transition: transform 0.1s ease;

              &.m {
                left: -18px;
                top: -2px;
              }
            }
          }
        `}
      >
        <span className="center">
          <span
            style={{
              transform: open
                ? "translate(-6px, -6px) rotate(+45deg)"
                : "translate(-6px, -8px)"
            }}
          />
          <span
            style={{
              transform: open
                ? "translate(+6px, -6px) rotate(-45deg)"
                : "translate(+6px, -8px)"
            }}
          />
          <span
            style={{
              transform: open ? "scale(0, 1)" : "scale(1.6, 1)"
            }}
          />
          <span
            style={{
              transform: open
                ? "translate(-6px, +6px) rotate(-45deg)"
                : "translate(-6px, +8px)"
            }}
          />
          <span
            style={{
              transform: open
                ? "translate(+6px, +6px) rotate(+45deg)"
                : "translate(+6px, +8px)"
            }}
          />
        </span>
      </button>
      <div
        css={`
          position: relative;
        `}
      >
        {open && (
          <div
            css={`
              position: absolute;
              top: 4px;
              left: 0;
              min-width: 240px;
              z-index: 50;

              background: white;
              border-radius: 4px;
              box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.3);

              animation: Menu_open_kf 0.2s ease;

              @keyframes Menu_open_kf {
                from {
                  transform: translate(0, 10px);
                  opacity: 0;
                }
                to {
                  transform: translate(0, 0);
                  opacity: 1;
                }
              }
            `}
          >
            <div css="padding: 0.6rem 0;">
              <ul
                css={`
                  margin: 0;
                  padding: 0;

                  li {
                    display: block;
                    margin: 0;
                    padding: 0;
                  }

                  button {
                    display: block;
                    box-sizing: border-box;
                    width: 100%;
                    border: 2px solid transparent;
                    background: none;
                    margin: 0;
                    padding: 0.3rem 1rem;
                    white-space: nowrap;

                    text-align: left;
                    font-family: "Work Sans", sans-serif;
                    font-size: 0.9rem;

                    cursor: pointer;
                    outline: none;

                    &:hover,
                    &:focus {
                      background: #eee;
                    }
                    &:active {
                      background: ${theme.blue};
                      color: white;
                    }
                  }
                `}
              >
                {items.map(item => {
                  return (
                    <li key={item.key}>
                      <button
                        css={
                          item.active
                            ? `
                            background: ${theme.blue} !important;
                            color: white !important;
                            `
                            : ""
                        }
                        onClick={() => onSelect(item, close)}
                      >
                        {item.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
