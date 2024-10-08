import { findSplitIndex, patchLines } from "./util.ts";

/**
 * Apply `headers` and `footers` to the current page `lines`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 * import { format } from "./format.ts";
 *
 * const headers = [
 *   "header start",
 *   "header content",
 *   "",
 *   "header end",
 * ];
 * const lines = [
 *   "何か",
 *   "aaa",
 *   "header content",
 *   " コメントが書いてあるかも",
 *   "header end modified",
 *   "",
 *   "本文とか",
 *   "おしまい",
 *   "footer end",
 *   " ↑footerの残骸",
 * ];
 * const footers = [
 *   "footer start",
 *   "footer content",
 *   "footer end",
 * ];

 * assertEquals<string[]>(format(lines, headers, footers), [
 *   "header start",
 *   "何か",
 *   "aaa",
 *   "header content",
 *   " コメントが書いてあるかも",
 *   "header end modified",
 *   "",
 *   "header end",
 *   "",
 *   "本文とか",
 *   "おしまい",
 *   "",
 *   "footer start",
 *   "footer content",
 *   "footer end",
 *   " ↑footerの残骸",
 * ]);
 * ```
 *
 * @param lines page content, which must not contain the title line
 * @param headers template header
 * @param footers template footer
 * @returns new page content applied to
 */
export const format = (
  lines: string[],
  headers: string[],
  footers: string[],
): string[] => {
  // headerとfooterに相当する行を補う
  const bodies = patchLines(
    patchLines(lines, headers).reverse(),
    [...footers].reverse(),
  ).reverse();

  // headerとfooterの間に余裕をもたせる
  const headerStart = findSplitIndex(bodies, headers);
  const footerStart = bodies.length - 1 - findSplitIndex(
    [...bodies].reverse(),
    [...footers].reverse(),
  );

  return [
    ...bodies.slice(0, headerStart + 1),
    "",
    ...bodies.slice(headerStart + 1, footerStart).join("\n").trim().split("\n"),
    "",
    ...bodies.slice(footerStart),
  ];
};
