import "styled-components/macro";
import React from "react";
import cx from "classnames";

import "./Spinner.scss";

export default function Spinner({ variant, size, color = "black", className }) {
  return (
    <div
      className={cx("Spinner", variant && "variant-" + variant, className)}
      css={
        size
          ? `
              position: relative;
              height: ${size}px;
              width: ${size}px;
              &::before {
                width: ${size}px;
                height: ${size}px;
                margin-top: -${size / 2}px;
                margin-left: -${size / 2}px;
                border-top-color: ${color};
              }
            `
          : undefined
      }
    />
  );
}
