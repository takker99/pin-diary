import { patchTemplate } from "./format.ts";
import { assertEquals } from "./deps.test.ts";

Deno.test("patchTemplate()", () => {
  const headers = [
    "header start",
    "header content",
    "",
    "header end",
  ];
  const lines = [
    "何か",
    "aaa",
    "header content",
    " コメントが書いてあるかも",
    "header end modified",
    "",
    "本文とか",
    "おしまい",
    "footer end",
    " ↑footerの残骸",
  ];
  const footers = [
    "footer start",
    "footer content",
    "footer end",
  ];

  assertEquals<string[]>(patchTemplate(lines, headers, footers), [
    "header start",
    "何か",
    "aaa",
    "header content",
    " コメントが書いてあるかも",
    "header end modified",
    "",
    "header end",
    "",
    "本文とか",
    "おしまい",
    "",
    "footer start",
    "footer content",
    "footer end",
    " ↑footerの残骸",
  ]);
});
