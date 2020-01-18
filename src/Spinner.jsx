import "styled-components/macro";
import React from "react";

export default function Spinner({ size = 40, color = "black", ...props }) {
  return (
    <div
      {...props}
      css={`
        position: relative;
        height: ${size}px;
        width: ${size}px;

        &::before {
          content: "";
          box-sizing: border-box;
          position: absolute;
          top: 50%;
          left: 50%;
          width: ${size}px;
          height: ${size}px;
          margin-top: -${size / 2}px;
          margin-left: -${size / 2}px;
          border-radius: 50%;
          border: 0.2rem solid #ccc;
          border-top-color: ${color};
          animation: Spinner_kf 0.6s linear infinite;
        }

        @keyframes Spinner_kf {
          to {
            transform: rotate(360deg);
          }
        }
      `}
    />
  );
}
