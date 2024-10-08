import { assertEquals } from "@std/assert/equals";
import { dayToNumber } from "./dayToNumber.ts";

Deno.test("dayToNumber()", () => {
  assertEquals(dayToNumber("Sun"), 0);
  assertEquals(dayToNumber("Mon"), 1);
  assertEquals(dayToNumber("Tue"), 2);
  assertEquals(dayToNumber("Wed"), 3);
  assertEquals(dayToNumber("Thu"), 4);
  assertEquals(dayToNumber("Fri"), 5);
  assertEquals(dayToNumber("Sat"), 6);
});
