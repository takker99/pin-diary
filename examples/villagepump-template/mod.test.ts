import { isOldDiary } from "./mod.ts";
import { assert } from "../../deps.test.ts";

Deno.test("isOldDiary()", () => {
  assert(!isOldDiary("2022/02/24aa", new Date(2022, 1, 24)));
  assert(!isOldDiary("2022/02/24", new Date(2022, 1, 24)));
  assert(isOldDiary("2022/02/24", new Date(2022, 1, 23)));
  assert(isOldDiary("2022/02/24", new Date(2022, 1, 25)));
});
