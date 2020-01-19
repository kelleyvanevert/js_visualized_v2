import "styled-components/macro";
import React, { useState } from "react";

import OutsideClickDetector from "./OutsideClickDetector";

export default function Menu({ isOpen, onOpenChange, children, ...props }) {
  return (
    <OutsideClickDetector {...props} onOutsideClick={() => onOpenChange(false)}>
      <button
        onClick={() => onOpenChange(!isOpen)}
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
              transform: isOpen
                ? "translate(-6px, -6px) rotate(+45deg)"
                : "translate(-6px, -8px)"
            }}
          />
          <span
            style={{
              transform: isOpen
                ? "translate(+6px, -6px) rotate(-45deg)"
                : "translate(+6px, -8px)"
            }}
          />
          <span
            style={{
              transform: isOpen ? "scale(0, 1)" : "scale(1.6, 1)"
            }}
          />
          <span
            style={{
              transform: isOpen
                ? "translate(-6px, +6px) rotate(-45deg)"
                : "translate(-6px, +8px)"
            }}
          />
          <span
            style={{
              transform: isOpen
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
        {isOpen && (
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
            {children}
          </div>
        )}
      </div>
    </OutsideClickDetector>
  );
}
