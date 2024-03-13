import { launch } from "../mod.ts";
import { isOldDiary, makeDiary } from "./villagepump-template/mod.ts";

launch(
  "villagepump",
  {
    makeDiary,
    isOldDiary,
  },
);
