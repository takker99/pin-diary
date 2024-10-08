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
 * import { parse } from "./parse.ts";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const date = new Date("2023-04-13T05:47:00");
 * assertEquals(parse(date, ["Today is @yyyy-MM-dd@"]), ["Today is 2023-04-13"]);
 * assertEquals(parse(date, ["Tomorrow is @yyyy-MM-dd+1@"]), ["Tomorrow is 2023-04-14"]);
 * assertEquals(parse(date, ["Yesterday was @yyyy-MM-dd-1@"]), ["Yesterday was 2023-04-12"]);
 * assertEquals(parse(date, ["20 days ago was @yyyy-MM-dd-20@"]), ["20 days ago was 2023-03-24"]);
 * assertEquals(parse(date, ["Next week is @yyyy-MM-dd+1w@"]), ["Next week is 2023-04-20"]);
 * assertEquals(parse(date, ["Previous week was @yyyy-MM-dd-1w@"]), ["Previous week was 2023-04-06"]);
 * assertEquals(parse(date, ["Next month is @yyyy-MM-dd+1m@"]), ["Next month is 2023-05-13"]);
 * assertEquals(parse(date, ["Previous month was @yyyy-MM-dd-1m@"]), ["Previous month was 2023-03-13"]);
 * assertEquals(parse(date, ["Next year is @yyyy-MM-dd+1y@"]), ["Next year is 2024-04-13"]);
 * assertEquals(parse(date, ["Previous year was @yyyy-MM-dd-1y@"]), ["Previous year was 2022-04-13"]);
 * assertEquals(parse(date, ["This week is @yyyy-ww@"]), ["This week is 2023-w15"]);
 * assertEquals(parse(date, ["Next week is @yyyy-ww+1w@"]), ["Next week is 2023-w16"]);
 * assertEquals(parse(date, ["Previous week was @yyyy-ww-1w@"]), ["Previous week was 2023-w14"]);
 * assertEquals(parse(date, ["This week list:"]), ["This week list:"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd(Sun)@"]), ["- 2023-04-09"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd(Mon)@"]), ["- 2023-04-10"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd(Tue)@"]), ["- 2023-04-11"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd(Wed)@"]), ["- 2023-04-12"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd(Thu)@"]), ["- 2023-04-13"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd(Fri)@"]), ["- 2023-04-14"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd(Sat)@"]), ["- 2023-04-15"]);
 * assertEquals(parse(date, ["2 weeks ago week list:"]), ["2 weeks ago week list:"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd-2w(Sun)@"]), ["- 2023-03-26"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd-2w(Mon)@"]), ["- 2023-03-27"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd-2w(Tue)@"]), ["- 2023-03-28"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd-2w(Wed)@"]), ["- 2023-03-29"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd-2w(Thu)@"]), ["- 2023-03-30"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd-2w(Fri)@"]), ["- 2023-03-31"]);
 * assertEquals(parse(date, ["- @yyyy-MM-dd-2w(Sat)@"]), ["- 2023-04-01"]);
 * assertEquals(parse(date, ["This month is @yyyy-MM@"]), ["This month is 2023-04"]);
 * assertEquals(parse(date, ["Next month is @yyyy-MM+1m@"]), ["Next month is 2023-05"]);
 * assertEquals(parse(date, ["Previous month was @yyyy-MM-1m@"]), ["Previous month was 2023-03"]);
 * assertEquals(parse(date, ["Next year is @yyyy-MM+1y@"]), ["Next year is 2024-04"]);
 * assertEquals(parse(date, ["Previous year was @yyyy-MM-1y@"]), ["Previous year was 2022-04"]);
 * ```
 *
 * @param date - The date to be used for replacement.
 * @param template - The template containing placeholders to be replaced.
 * @returns An array of strings with the replaced values.
 */
export const parse = (date: Date, template: string[]): string[] =>
  template.map((line) =>
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
