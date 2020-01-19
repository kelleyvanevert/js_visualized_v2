import "styled-components/macro";
import React from "react";

import { IoIosArrowDroprightCircle } from "react-icons/io";

export default function Intro() {
  return (
    <div>
      <h2>What's this?</h2>
      <p>
        You're looking at a little tool that helps to{" "}
        <strong>visualize the step-wise execution of JavaScript code.</strong>{" "}
        This can help people new to programming understand the mechanical and
        structured way execution works in a visual way.
      </p>
      <p css="font-size: 1.1em; padding-left: 30px; position: relative;">
        <IoIosArrowDroprightCircle
          css={`
            vertical-align: text-bottom;
            margin-bottom: 1px;
            position: absolute;
            left: 0;
            top: 4px;
          `}
        />
        Write some JavaScript code in the editor above, then use the slider to
        step through the execution flow.
      </p>
      <p>
        Built as a teaching purposes experiment for my students at{" "}
        <a href="https://codaisseur.com/">Codaisseur</a> and{" "}
        <a href="https://www.hackyourfuture.net/">HackYourFuture</a>.
      </p>
    </div>
  );
}
