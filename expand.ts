import { dayToNumber } from "./dayToNumber.ts";
import { subWeeks } from "date-fns/subWeeks";
import { subMonths } from "date-fns/subMonths";
import { subYears } from "date-fns/subYears";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  getWeek,
  getYear,
  lightFormat,
  startOfWeek,
  subDays,
} from "date-fns";

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
 * @param date - The date to be used for replacement.
 * @param template - The template containing placeholders to be replaced.
 * @returns An array of strings with the replaced values.
 */
export const expand = (date: Date, template: string): string[] =>
  template.split("\n").map((line) =>
    line.replaceAll("@yyyy@", lightFormat(date, "yyyy"))
      .replaceAll(
        "@yyyy-MM-dd HH:mm:ss@",
        lightFormat(date, "yyyy-MM-dd HH:mm:ss"),
      )
      .replaceAll("@yyyy-MM-dd@", lightFormat(date, "yyyy-MM-dd"))
      .replace(
        /@yyyy-MM-dd(?:([+-])(\d+)([ymw]?))?(?:\((Sun|Mon|Tue|Wed|Thu|Fri|Sat)\))?@/g,
        (_, pm, amount, unit, day) => {
          let newDate = walkDate(date, pm, unit, parseInt(amount));
          if (day) {
            newDate = addDays(startOfWeek(newDate), dayToNumber(day));
          }
          return lightFormat(newDate, "yyyy-MM-dd");
        },
      )
      .replaceAll(
        "@yyyy-ww@",
        `${getYear(date)}-w${`${getWeek(date)}`.padStart(2, "0")}`,
      )
      .replace(
        /@yyyy-ww([+-])(\d+)([ymw]?)@/g,
        (_, pm, amount, unit) => {
          const newDate = walkDate(date, pm, unit, parseInt(amount));
          return `${getYear(newDate)}-w${
            `${getWeek(newDate)}`.padStart(2, "0")
          }`;
        },
      )
      .replaceAll("@yyyy-MM@", lightFormat(date, "yyyy-MM"))
      .replace(
        /@yyyy-MM([+-])(\d+)([ymw]?)@/g,
        (_, pm, amount, unit) => {
          const newDate = walkDate(date, pm, unit, parseInt(amount));
          return lightFormat(newDate, "yyyy-MM");
        },
      )
  );

const walkDate = (
  date: Date,
  pm: string,
  unit: string,
  amount: number,
): Date => {
  let newDate = date;
  if (pm) {
    const plus = pm === "+";
    if (unit === "y") {
      newDate = (plus ? addYears : subYears)(date, amount);
    } else if (unit === "m") {
      newDate = (plus ? addMonths : subMonths)(date, amount);
    } else if (unit === "w") {
      newDate = (plus ? addWeeks : subWeeks)(date, amount);
    } else {
      newDate = (plus ? addDays : subDays)(date, amount);
    }
  }
  return newDate;
};
