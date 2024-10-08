import { launch } from "../mod.ts";
import { isOldDiary, makeDiary } from "./villagepump-template/mod.ts";
import { isWithinInterval } from "date-fns/isWithinInterval";

if (
  isWithinInterval(new Date(), {
    start: new Date(2022, 3, 29),
    end: new Date(2022, 5, 5),
  })
) {
  launch(
    "villagepump",
    {
      makeDiary,
      isOldDiary,
    },
  );
}
