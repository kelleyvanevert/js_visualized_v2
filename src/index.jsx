import "babel-polyfill";
import React from "react";
import { render } from "react-dom";

import "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";

import "./prism-ghcolors.css";

import App from "./App";

render(<App />, document.getElementById("app"));
