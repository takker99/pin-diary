import { format } from "./format.ts";
import { assertEquals } from "@std/assert/equals";

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

  assertEquals<string[]>(format(lines, headers, footers), [
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
