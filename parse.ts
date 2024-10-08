import {
  all,
  and,
  chain,
  choice,
  map,
  match,
  next,
  ok,
  or,
  parse as parseText,
  type ParseFail,
  type ParseOK,
  type Parser,
  text,
} from "@takker/parser";
import { dayToNumber } from "./dayToNumber.ts";
import { getHours } from "date-fns/getHours";
import { getMinutes } from "date-fns/getMinutes";
import { getSeconds } from "date-fns/getSeconds";
import { addDays } from "date-fns/addDays";
import { addMonths } from "date-fns/addMonths";
import { addWeeks } from "date-fns/addWeeks";
import { addYears } from "date-fns/addYears";
import { startOfWeek } from "date-fns/startOfWeek";
import { yyyy, yyyyMM, yyyyMMdd, yyyyww, zero } from "./util.ts";

const HH = (date: Date) => `${zero(getHours(date))}`;
const HHmm = (date: Date) => `${HH(date)}:${zero(getMinutes(date))}`;
const HHmmss = (date: Date) => `${HHmm(date)}:${zero(getSeconds(date))}`;

const year = /* @__PURE__ */ text("yyyy");
const month = /* @__PURE__ */ text("MM");
const date = /* @__PURE__ */ text("dd");
const week = /* @__PURE__ */ text("ww");
const hour = /* @__PURE__ */ text("HH");
const minute = /* @__PURE__ */ text("mm");
const second = /* @__PURE__ */ text("ss");
const blank = /* @__PURE__ */ match(/\s/);
const anySep = /* @__PURE__ */ match(/[^Mw]?/);
const colon = /* @__PURE__ */ text(":");
const time = /* @__PURE__ */ next(
  hour,
  or(
    next(
      and(colon, minute),
      or(
        next(and(colon, second), ok(HHmmss)),
        ok(HHmm),
      ),
    ),
    ok(HH),
  ),
) satisfies Parser<(date: Date) => string>;

const digit = /* @__PURE__ */ map(match(/[-+]\d+/), (s) => parseInt(s));
const step = /* @__PURE__ */ choice(
  text("y"),
  text("m"),
  text("d"),
  text("w"),
  text(""),
);
const move = /* @__PURE__ */ and(digit, step);
const lParen = /* @__PURE__ */ text("(");
const rParen = /* @__PURE__ */ text(")");
const adjust = /* @__PURE__ */ map(
  all(
    lParen,
    choice(
      text("Sun"),
      text("Mon"),
      text("Tue"),
      text("Wed"),
      text("Thu"),
      text("Fri"),
      text("Sat"),
    ),
    rParen,
  ),
  ([, day]) => dayToNumber(day),
);

const dateFormat = /* @__PURE__ */ next(
  year,
  or(
    chain(anySep, (sep_) => {
      const sep = text(sep_);

      return or(
        next(
          month,
          or(
            next(and(sep, date), ok((date: Date) => yyyyMMdd(date, sep_))),
            ok((date: Date) => yyyyMM(date, sep_)),
          ),
        ),
        next(week, ok((date: Date) => yyyyww(date, sep_))),
      );
    }),
    ok(yyyy),
  ),
) satisfies Parser<(date: Date) => string>;

/**
 * @internal
 * Parse a placeholder for templates
 */
export const parse = (
  placeholder: `@${string}@`,
): ParseFail | ParseOK<(date: Date) => string> =>
  parseText(
    map(
      all(
        dateFormat,
        map(
          or(move, ok([0, "d"] as const)),
          ([amount, unit]) => (date: Date) => walkDate(date, amount, unit),
        ),
        or(adjust, ok(undefined)),
        or(and(blank, time), ok(["", () => ""])) satisfies Parser<
          [string, (date: Date) => string]
        >,
      ),
      ([formatDate, walk, day, [space, formatTime]]) => (date: Date) => {
        const walked = walk(date);
        const adjusted = day !== undefined
          ? addDays(startOfWeek(walked), day)
          : walked;
        return `${formatDate(adjusted)}${space}${formatTime(adjusted)}`;
      },
    ),
    placeholder.slice(1, -1),
  );

const walkDate = (
  date: Date,
  amount: number,
  unit: "y" | "m" | "w" | "d" | "",
): Date => {
  switch (unit) {
    case "y":
      return addYears(date, amount);
    case "m":
      return addMonths(date, amount);
    case "w":
      return addWeeks(date, amount);
    case "d":
    case "":
      return addDays(date, amount);
  }
};
