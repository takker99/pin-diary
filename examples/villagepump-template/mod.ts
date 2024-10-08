import {
  addDays,
  getDay,
  getDayOfYear,
  getDaysInYear,
  getWeek,
  getYear,
  intervalToDuration,
  lightFormat,
  subDays,
  subYears,
} from "date-fns";

const format = "yyyy/MM/dd";

/**
 * Create the template for [/villagepump] */
export const makeDiary = (date: Date): {
  title: string;
  header: string[];
  footer: string[];
} => {
  /** 井戸端で日記が始まってからの年数 */
  const intervalY =
    intervalToDuration({ start: new Date(2020, 9, 9), end: date }).years;

  return {
    title: toTitle(date),
    header: [
      `第${getWeek(date)}週: ${youbiLine(date)}`,
      `${getYear(date)}年 ${
        (getDayOfYear(date) * 100 / getDaysInYear(date)).toFixed(2)
      }％経過`,
      "",
      "今日のn年前",
      ...[...Array(intervalY).keys()].map(
        (i) => ` [${lightFormat(subYears(date, i + 1), format)}]`,
      ),
    ],
    footer: [
      `[${lightFormat(subDays(date, 1), format)}]←${
        lightFormat(date, format)
      }→[${lightFormat(addDays(date, 1), format)}]`,
      `[/ [${lightFormat(date, "yyyy/MM")}.icon]]`,
    ],
  };
};

const youbiLine = (date: Date): string => {
  const day = getDay(date);
  return [..."日月火水木金土"].map(
    (char, i) => i === day ? `[[${char}]]` : char,
  ).join("");
};
const dateRegExp = /^\d{4}\/\d{2}\/\d{2}$/;

/**
 * @internal
 * Check if `title` is not `today`'s diary page title.
 */
export const isOldDiary = (title: string, today: Date): boolean => {
  if (!dateRegExp.test(title)) return false;
  return toTitle(today) !== title;
};

const toTitle = (date: Date): string => lightFormat(date, format);
