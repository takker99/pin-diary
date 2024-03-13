import { findSplitIndex, patchLines } from "./util.ts";

// linesにタイトルを入れないように
export const patchTemplate = (
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
