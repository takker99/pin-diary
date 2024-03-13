/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom"/>
import {
  pin,
  unpin,
  patch,
  useStatusBar,
  sleep,
  makeSocket,
  disconnect,
} from "./deps.ts";
import{patchTemplate as format} from "./format.ts";
import { listPinnedPages } from "./list.ts";
import type { Scrapbox, Socket } from "./deps.ts";
declare const scrapbox: Scrapbox;

export interface DiaryInit {
  /** 与えられた日付の日記ページのテンプレートを作る */
  makeDiary: (date: Date) => {
    title: string;
    header: string[];
    footer: string[];
  },
  /** 今日以外の日記ページかどうかを判断する函数
   *
   * @param title 判断対象のページタイトル
   * @param today 今日の日付
   * @param 今日以外の日記ページなら`true`, それ以外のページは `false`
   */
  isOldDiary: (title: string, today: Date) => boolean;
}

// initialize
export const launch = (
  project: string,
  init: DiaryInit & { interval?: number },
) => {
  const interval = init.interval ?? 24 * 3600 * 1000;

  const handleChange = () =>
    scrapbox.Project.name === project ?
      startObserve(project, interval, init) :
      endObserve();
  handleChange();
  scrapbox.addListener("project:changed", handleChange);
};

let updateTimer: number | undefined;
const startObserve = async (
  project: string,
  interval: number,
  init: DiaryInit,
) => {
  endObserve();
  await pinDiary(project, new Date(), init);
  updateTimer = setInterval(
    () => pinDiary(project, new Date(), init),
    interval,
  );
};
const endObserve = () => clearInterval(updateTimer);

export const pinDiary = async (
  project: string,
  date: Date,
  { makeDiary, isOldDiary, }: DiaryInit,
): Promise<void> => {
  const { render, dispose } = useStatusBar();
  let socket: Socket | undefined;
  try {
    // 今日以外の日付ページを外す
    render(
      { type: "spinner" },
      { type: "text", text: `unpin other diary pages...`},
    );
    socket = await makeSocket();
    for await (const { title } of listPinnedPages(project)) {
      if (!isOldDiary(title, date)) continue;
      await unpin(project, title, { socket });
    }

    // 今日の日付ページをピン留めする
    const { title, header, footer } = makeDiary(date);
    render(
      { type: "spinner" },
      { type: "text", text: `pin "/${project}/${title}"...`},
    );
    await pin(project, title, { socket, create: true });

    // 今日の日付ページにtemplateを挿入する
    render(
      { type: "spinner" },
      { type: "text", text: `format "/${project}/${title}"...`},
    );
    await patch(project, title, (lines) => [
      lines[0].text,
      ...format(
        lines.slice(1).map(line => line.text),
        header,
        footer,
      ),
    ], { socket });

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
    if (socket) await disconnect(socket);
    await sleep(1000);
    dispose();
  }
};