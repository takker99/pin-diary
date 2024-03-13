import { launch } from "../mod.ts";
import {
  makeDiary, isOldDiary,
} from "./villagepump-template/mod.ts";

launch(
  "villagepump",
  {
    makeDiary,
    isOldDiary,
  },
);