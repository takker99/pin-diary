import { launch } from "../mod.ts";
import { villagepumpDiaryTemplate } from "./villagepump-template.ts";
import { isWithinInterval } from "date-fns/isWithinInterval";

if (
  isWithinInterval(new Date(), {
    start: new Date(2022, 3, 29),
    end: new Date(2022, 5, 5),
  })
) {
  launch("villagepump", villagepumpDiaryTemplate);
}
