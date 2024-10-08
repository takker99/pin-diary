/**
 * Converts a day string to a number representation.
 * @param day - The day string to convert.
 * @returns The number representation of the day:
 * - 0: "Sun"
 * - 1: "Mon"
 * - 2: "Tue"
 * - 3: "Wed"
 * - 4: "Thu"
 * - 5: "Fri"
 * - 6: Any other day
 *
 * @example
 * ```ts
 * import { dayToNumber } from "./dayToNumber.ts";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(dayToNumber("Sun"), 0);
 * assertEquals(dayToNumber("Mon"), 1);
 * assertEquals(dayToNumber("Tue"), 2);
 * assertEquals(dayToNumber("Wed"), 3);
 * assertEquals(dayToNumber("Thu"), 4);
 * assertEquals(dayToNumber("Fri"), 5);
 * assertEquals(dayToNumber("Sat"), 6);
 * ```
 */
export const dayToNumber = (day: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
  switch (day) {
    case "Sun":
      return 0;
    case "Mon":
      return 1;
    case "Tue":
      return 2;
    case "Wed":
      return 3;
    case "Thu":
      return 4;
    case "Fri":
      return 5;
    default:
      return 6;
  }
};
