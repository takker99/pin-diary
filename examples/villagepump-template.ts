import type { Template } from "../template.ts";

/** the template for [/villagepump]
 *
 * @example
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 * import { villagepumpDiaryTemplate } from "./villagepump-template.ts";
 * import { makeDiaryMaker } from "../template.ts";
 *
 * assertEquals(makeDiaryMaker(villagepumpDiaryTemplate).makeDiary(new Date(2024, 9, 1)), {
 *   title: "2024/10/01",
 *   header: [
 *     "第40週: 日月[[火]]水木金土",
 *     "2024年 75.14％経過",
 *     "",
 *     "今日のn年前",
 *     " [2023/10/01]",
 *     " [2022/10/01]",
 *     " [2021/10/01]",
 *   ],
 *   footer: [
 *     "[2024/09/30]←[2024/10/01]→[2024/10/02]",
 *     "[2024/10.icon]",
 *   ],
 * });
 * ```
 */
export const villagepumpDiaryTemplate: Template = {
  title: "@yyyy/MM/dd@",
  header: [
    "第@w@週: @day_indicator@",
    "@yyyy@年 @progress@％経過",
    "",
    "今日のn年前",
    " @[from_2020/10/09]@",
  ].join("\n"),
  footer: [
    "[@yyyy/MM/dd-1@]←[@yyyy/MM/dd@]→[@yyyy/MM/dd+1@]",
    "[@yyyy/MM@.icon]",
  ].join("\n"),
};
