/**
 * @internal
 * Patches the given lines by appending new lines from the `appends` array.
 *
 * This function iterates over the `appends` array and tries to find each element
 * in the `lines` array. If an element from `appends` is found in `lines`, it copies
 * all lines from the current index up to and including the found element into the result.
 * If an element from `appends` is not found, it is directly appended to the result.
 *
 * @example
 * ```ts
 * import { patchLines } from "./util.ts";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const template = [
 *   "template start",
 *   "template template",
 *   "template end",
 * ];
 * const lines = [
 *   "何か",
 *   "aaa",
 *   "template template",
 *   " コメントが書いてあるかも",
 *   "template end modified",
 *   "",
 *   "本文とか",
 *   "おしまい",
 * ];
 * assertEquals<string[]>(patchLines(lines, template), [
 *   "template start",
 *   "何か",
 *   "aaa",
 *   "template template",
 *   "template end",
 *   " コメントが書いてあるかも",
 *   "template end modified",
 *   "",
 *   "本文とか",
 *   "おしまい",
 * ]);
 * ```
 *
 * @param lines - The original array of strings to be patched.
 * @param appends - The array of strings to append to the original lines.
 * @returns A new array of strings with the patches applied.
 */
export const patchLines = (lines: string[], appends: string[]): string[] => {
  let index = 0;
  const result = [] as string[];
  for (let i = 0; i < appends.length; i++) {
    const pos = lines.findIndex((line, j) =>
      j >= index && line.trim() === appends[i].trim()
    );
    if (pos < 0) {
      result.push(appends[i]);
      continue;
    }
    result.push(...lines.slice(index, pos + 1));
    index = pos + 1;
  }
  result.push(...lines.slice(index));
  return result;
};

/**
 * @internal
 * Finds the index in the `lines` array where the sequence of strings in `query` ends.
 *
 * @param lines - An array of strings to search within.
 * @param query - An array of strings to search for in sequence.
 * @returns The index in the `lines` array where the sequence of `query` ends, or -1 if the sequence is not found.
 */
export const findSplitIndex = (lines: string[], query: string[]) => {
  let index = -1;
  for (const text of query) {
    const pos = lines.findIndex((line, j) =>
      j > index && line.trim() === text.trim()
    );
    if (pos < 0) return -1;
    index = pos;
  }
  return index;
};
