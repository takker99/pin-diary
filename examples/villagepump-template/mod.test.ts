import { isOldDiary } from "./mod.ts";
import { assert } from "@std/assert/assert";

Deno.test("isOldDiary()", () => {
  assert(!isOldDiary("2022/02/24aa", new Date(2022, 1, 24)));
  assert(!isOldDiary("2022/02/24", new Date(2022, 1, 24)));
  assert(isOldDiary("2022/02/24", new Date(2022, 1, 23)));
  assert(isOldDiary("2022/02/24", new Date(2022, 1, 25)));
});
