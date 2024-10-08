import { getWeek } from "date-fns/getWeek";
import { parse } from "./parse.ts";
import { yyyyMMdd, zero } from "./util.ts";
import { getDayOfYear } from "date-fns/getDayOfYear";
import { getDaysInYear } from "date-fns/getDaysInYear";
import { intervalToDuration } from "date-fns/intervalToDuration";
import { subYears } from "date-fns/subYears";
import { getDay } from "date-fns/getDay";

/**
 * Replaces placeholders in the template with formatted date values.
 *
 * @example
 * ```ts
 * import { expand } from "./expand.ts";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const date = new Date("2023-04-13T05:47:00");
 * assertEquals(expand(date, "Today is @yyyy-MM-dd@"), ["Today is 2023-04-13"]);
 * assertEquals(expand(date, "Tomorrow is @yyyy-MM-dd+1@"), ["Tomorrow is 2023-04-14"]);
 * assertEquals(expand(date, "Yesterday was @yyyy-MM-dd-1@"), ["Yesterday was 2023-04-12"]);
 * assertEquals(expand(date, "20 days ago was @yyyy-MM-dd-20@"), ["20 days ago was 2023-03-24"]);
 * assertEquals(expand(date, "Next week is @yyyy-MM-dd+1w@"), ["Next week is 2023-04-20"]);
 * assertEquals(expand(date, "Previous week was @yyyy-MM-dd-1w@"), ["Previous week was 2023-04-06"]);
 * assertEquals(expand(date, "Next month is @yyyy-MM-dd+1m@"), ["Next month is 2023-05-13"]);
 * assertEquals(expand(date, "Previous month was @yyyy-MM-dd-1m@"), ["Previous month was 2023-03-13"]);
 * assertEquals(expand(date, "Next year is @yyyy-MM-dd+1y@"), ["Next year is 2024-04-13"]);
 * assertEquals(expand(date, "Previous year was @yyyy-MM-dd-1y@"), ["Previous year was 2022-04-13"]);
 * assertEquals(expand(date, "This week is @yyyy-ww@"), ["This week is 2023-w15"]);
 * assertEquals(expand(date, "Next week is @yyyy-ww+1w@"), ["Next week is 2023-w16"]);
 * assertEquals(expand(date, "Previous week was @yyyy-ww-1w@"), ["Previous week was 2023-w14"]);
 * assertEquals(expand(date, "This week list:"), ["This week list:"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd(Sun)@"), ["- 2023-04-09"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd(Mon)@"), ["- 2023-04-10"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd(Tue)@"), ["- 2023-04-11"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd(Wed)@"), ["- 2023-04-12"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd(Thu)@"), ["- 2023-04-13"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd(Fri)@"), ["- 2023-04-14"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd(Sat)@"), ["- 2023-04-15"]);
 * assertEquals(expand(date, "2 weeks ago week list:"), ["2 weeks ago week list:"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd-2w(Sun)@"), ["- 2023-03-26"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd-2w(Mon)@"), ["- 2023-03-27"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd-2w(Tue)@"), ["- 2023-03-28"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd-2w(Wed)@"), ["- 2023-03-29"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd-2w(Thu)@"), ["- 2023-03-30"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd-2w(Fri)@"), ["- 2023-03-31"]);
 * assertEquals(expand(date, "- @yyyy-MM-dd-2w(Sat)@"), ["- 2023-04-01"]);
 * assertEquals(expand(date, "This month is @yyyy-MM@"), ["This month is 2023-04"]);
 * assertEquals(expand(date, "Next month is @yyyy-MM+1m@"), ["Next month is 2023-05"]);
 * assertEquals(expand(date, "Previous month was @yyyy-MM-1m@"), ["Previous month was 2023-03"]);
 * assertEquals(expand(date, "Next year is @yyyy-MM+1y@"), ["Next year is 2024-04"]);
 * assertEquals(expand(date, "Previous year was @yyyy-MM-1y@"), ["Previous year was 2022-04"]);
 * ```
 *
 * @example Using Special tags
 * ```ts
 * import { expand } from "./expand.ts";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const template = [
 *   "@yyyy/MM/dd@",
 *   "第@w@週: @day_indicator@",
 *   "@yyyy@年 @progress@％経過",
 *   "",
 *   "今日のn年前",
 *   " @[from_2020/10/09]@",
 *   "",
 *   "[@yyyy/MM/dd-1@]←[@yyyy/MM/dd@]→[@yyyy/MM/dd+1@]",
 *   "[@yyyy/MM@.icon]",
 * ].join("\n");
 * assertEquals(expand(new Date(2024, 9, 1), template), [
 *   "2024/10/01",
 *   "第40週: 日月[[火]]水木金土",
 *   "2024年 75.14％経過",
 *   "",
 *   "今日のn年前",
 *   " [2023/10/01]",
 *   " [2022/10/01]",
 *   " [2021/10/01]",
 *   "",
 *   "[2024/09/30]←[2024/10/01]→[2024/10/02]",
 *   "[2024/10.icon]",
 * ]);
 * ```
 *
 * @param date - The date to be used for replacement.
 * @param template - The template containing placeholders to be replaced.
 * @returns An array of strings with the replaced values.
 */
export const expand = (date: Date, template: string): string[] =>
  template.split("\n").flatMap((line) =>
    line
      // special tags
      .replaceAll("@w@", `${getWeek(date)}`)
      .replaceAll("@ww@", `${zero(getWeek(date))}`)
      .replaceAll("@day_indicator@", `${youbiLine(date)}`)
      .replaceAll(
        "@progress@",
        `${(getDayOfYear(date) * 100 / getDaysInYear(date)).toFixed(2)}`,
      )
      .replace(
        /^(\s*)@\[from_(\d{4})(\D?)(\d{2})(\D?)(\d{2})\]@\s*/,
        (_, indent, y, sep1, m, sep2, d) => {
          const start = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));

          const years = intervalToDuration({ start, end: date }).years ?? 0;

          return [...Array(years).keys()].map(
            (i) =>
              `${indent}[${
                yyyyMMdd(subYears(date, i + 1), sep1 ?? sep2 ?? "")
              }]`,
          ).join("\n");
        },
      )
      // general patterns
      .replace(
        /@[^@]+@/g,
        (input) => {
          const result = parse(input as `@${string}@`);
          return result.ok ? result.value(date) : input;
        },
      ).split("\n")
  );

const youbiLine = (date: Date): string => {
  const day = getDay(date);
  return [..."日月火水木金土"].map(
    (char, i) => i === day ? `[[${char}]]` : char,
  ).join("");
};
