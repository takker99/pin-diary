// 一年の経過率を計算するのに必要
import getDaysInYear from "https://deno.land/x/date_fns@v2.22.1/getDaysInYear/index.ts";
import getDayOfYear from "https://deno.land/x/date_fns@v2.22.1/getDayOfYear/index.ts";
// 日付計算に使う
import addDays from "https://deno.land/x/date_fns@v2.22.1/addDays/index.ts";
import subDays from "https://deno.land/x/date_fns@v2.22.1/subDays/index.ts";
import subWeeks from "https://deno.land/x/date_fns@v2.22.1/subWeeks/index.ts";
import subMonths from "https://deno.land/x/date_fns@v2.22.1/subMonths/index.ts";
import subYears from "https://deno.land/x/date_fns@v2.22.1/subYears/index.ts";
import getDay from "https://deno.land/x/date_fns@v2.22.1/getDay/index.ts";
import getYear from "https://deno.land/x/date_fns@v2.22.1/getYear/index.ts";
// 文字列変換に使う
import lightFormat from "https://deno.land/x/date_fns@v2.22.1/lightFormat/index.ts";

const format = "yyyy/MM/dd";

/** 指定された日付の日記ページを取得する
 *
 * @param date 取得したい日記ページの日付
 * @return 日記ページのタイトルとヘッダーとフッター
 */
export const getTemplate = (date: Date): [string, string, string] => [
  lightFormat(date, format),
  [
    `[${lightFormat(subDays(date, 1), format)}.icon]←${
      lightFormat(date, format)
    }→[${lightFormat(addDays(date, 1), format)}.icon]`,
    `[[${getYoubi(date)}曜日]]`,
    `${getYear(date)}年 ${
      (getDayOfYear(date) * 100 / getDaysInYear(date)).toFixed(2)
    }％経過`,
    `[🌏 https://ja.wikipedia.org/wiki/${lightFormat(date, "M月d日")}]`,
    [
      `[${lightFormat(subWeeks(date, 1), format)}.icon]`,
      `[${lightFormat(subWeeks(date, 2), format)}.icon]`,
      `[${lightFormat(subWeeks(date, 3), format)}.icon]`,
      `[${lightFormat(subMonths(date, 1), format)}.icon]`,
      `[${lightFormat(subMonths(date, 2), format)}.icon]`,
      `[${lightFormat(subMonths(date, 3), format)}.icon]`,
    ].join(" "),
    "今日のn年前",
    ` [${lightFormat(subYears(date, 1), format)}]`,
  ].join("\n"),
  `[${lightFormat(subDays(date, 1), format)}]←${
    lightFormat(date, format)
  }→[${lightFormat(addDays(date, 1), format)}]`,
];

function getYoubi(date: Date) {
  switch(getDay(date)) {
    case 0:
      return "日";
    case 1:
      return "月";
    case 2:
      return "火";
    case 3:
      return "水";
    case 4:
      return "木";
    case 5:
      return "金";
    case 6:
      return "土";
  }
}