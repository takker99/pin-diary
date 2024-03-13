/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom"/>
import { patchTemplate } from "./format.ts";
import {
  pin,
  unpin,
  patch,
  useStatusBar,
  sleep,
} from "./deps.ts";
import{ getTemplate } from "./diary.ts";
import { listPinnedDiaries } from "./list.ts";
import type { Scrapbox } from "./deps.ts";
declare const scrapbox: Scrapbox;

// initialize
export function launch(project: string, interval = 24 * 3600 * 1000) {
  const handleChange = () =>
    scrapbox.Project.name === project ? startObserve(project, interval) : endObserve();

  handleChange();
  scrapbox.addListener("project:changed", handleChange);
}

let updateTimer: number | undefined;
async function startObserve(project: string, interval: number) {
  endObserve();
  await pinDiary(project, new Date());
  updateTimer = setInterval(
    () => pinDiary(project, new Date()),
    interval,
  );
}
function endObserve() {
  clearInterval(updateTimer);
}

export async function pinDiary(project: string, date: Date): Promise<void> {
  const { render, dispose } = useStatusBar();
  try {
    // 今日以外の日付ページを外す
    render(
      { type: "spinner" },
      { type: "text", text: `unpin other diary pages...`},
    );
    for await (const { title } of listPinnedDiaries(project)) {
      if (title === toYYYYMMDD(date)) continue;
        await unpin(project, title, {});
    }

    // 今日の日付ページをピン留めする
    const [title, header, footer] = getTemplate(date);
    render(
      { type: "spinner" },
      { type: "text", text: `pin "/${project}/${title}"...`},
    );
    await pin(project, title, { create: true });

    // 今日の日付ページにtemplateを挿入する
    const headers = header.split("\n");
    const footers = footer.split("\n");
    render(
      { type: "spinner" },
      { type: "text", text: `format "/${project}/${title}"...`},
    );
    await patch(project, title, (lines) => [
      lines[0].text,
      ...patchTemplate(
        lines.slice(1).map(line => line.text),
        headers,
        footers,
      ),
    ]);

    render(
      { type: "check-circle" },
      { type: "text", text: `Pinned "/${project}/${title}".`},
    );
  } catch(e: unknown) {
    render(
      { type: "exclamation-triangle" },
      { type: "text", text: e instanceof Error ?
        `${e.name} ${e.message}` :
        `Unknown error! (see developper console)`,
      },
    );
    console.error(e);
  } finally {
    await sleep(1000);
    dispose();
  }
}

function toYYYYMMDD(date: Date) {
  return `${date.getFullYear()}/${zero(date.getMonth() + 1)}/${
    zero(date.getDate())
  }`;
}
function zero(n: number) {
  return String(n).padStart(2, "0");
}