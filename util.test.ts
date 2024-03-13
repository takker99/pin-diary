import { patchLines } from "./util.ts";
import { assertEquals } from "./deps.test.ts";

Deno.test("patchLines()", () => {
  const template = [
    "template start",
    "template template",
    "template end",
  ];
  const lines = [
    "何か",
    "aaa",
    "template template",
    " コメントが書いてあるかも",
    "template end modified",
    "",
    "本文とか",
    "おしまい",
  ];
  assertEquals<string[]>(patchLines(lines, template), [
    "template start",
    "何か",
    "aaa",
    "template template",
    "template end",
    " コメントが書いてあるかも",
    "template end modified",
    "",
    "本文とか",
    "おしまい",
  ]);
})