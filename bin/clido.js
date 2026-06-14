#!/usr/bin/env node

import cfonts from "cfonts";

const { say } = cfonts;

say("clido", {
  font: "block",
  align: "left",
  colors: ["cyan", "blue"],
  space: true,
});

console.log("ローカルファーストな todo 管理 CLI\n");
