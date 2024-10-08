import {
  connect,
  disconnect,
  patch,
  pin,
  type PushError,
  type ScrapboxSocket,
  unpin,
  useStatusBar,
} from "@cosense/std/browser";
import type { Scrapbox } from "@cosense/types/userscript";
import { patchTemplate as format } from "./format.ts";
import { delay } from "@std/async/delay";
import { isString } from "@core/unknownutil/is/string";
import { listPinnedPages } from "./list.ts";
import {
  andThenAsyncForResult,
  createOk,
  isErr,
  isOk,
  type Result,
  unwrapErr,
} from "option-t/plain_result";
import type { Socket } from "socket.io-client";
export { patchTemplate } from "./format.ts";

declare const scrapbox: Scrapbox;

/**
 * parameters for {@linkcode launch}
 */
export interface DiaryInit {
  /** 与えられた日付の日記ページのテンプレートを作る */
  makeDiary: (date: Date) => {
    title: string;
    header: string[];
    footer: string[];
  };
  /** 今日以外の日記ページかどうかを判断する函数
   *
   * @param title 判断対象のページタイトル
   * @param today 今日の日付
   * @param 今日以外の日記ページなら`true`, それ以外のページは `false`
   */
  isOldDiary: (title: string, today: Date) => boolean;
}

/**
 * Start pin-diary
 *
 * @param project - The name of the project to pin diary pages
 * @param init - parameters for pin-diary
 * @returns a function to stop pin-diary
 */
export const launch = (
  project: string,
  init: DiaryInit & { interval?: number },
): () => void => {
  const interval = init.interval ?? 24 * 3600 * 1000;

  const handleChange = () =>
    scrapbox.Project.name === project
      ? startObserve(project, interval, init)
      : endObserve();
  handleChange();
  scrapbox.addListener("project:changed", handleChange);

  return () => {
    endObserve();
    scrapbox.removeListener("project:changed", handleChange);
  };
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

/**
 * Pin [/`project`/`date`] and format it with the template
 *
 * To understand the syntax of the template, see the example of {@linkcode patchTemplate}
 *
 * @example
 * ```ts ignore
 * import { pinDiary } from "./mod.ts";
 * import { lightFormat } from "date-fns";
 *
 * await pinDiary("my-project", new Date(), {
 *   makeDiary: (date) => ({
 *     title: lightFormat(date, "yyyy-MM-dd"),
 *     header: [],
 *     footer: ["[@yyyy-MM-dd-1@] ← [@yyyy-MM-dd@] → [@yyyy-MM-dd+1@]"],
 *   }),
 *   isOldDiary: (title, today) => title !== lightFormat(today, "yyyy-MM-dd"),
 * });
 * ```
 *
 * @param project - The name of the project to pin diary pages
 * @param date - The date to pin diary page
 * @param init - parameters for pin-diary
 */
export const pinDiary = async (
  project: string,
  date: Date,
  init: DiaryInit,
): Promise<void> => {
  const { makeDiary, isOldDiary } = init;
  const { render, dispose } = useStatusBar();
  let socket: ScrapboxSocket | undefined;
  try {
    const res = await andThenAsyncForResult(
      (await connect()) as Result<
        ScrapboxSocket,
        Socket.DisconnectReason | PushError
      >,
      async (s) => {
        socket = s;
        // 今日以外の日付ページを外す
        render(
          { type: "spinner" },
          { type: "text", text: `unpin other diary pages...` },
        );
        for await (const { title } of listPinnedPages(project)) {
          if (!isOldDiary(title, date)) continue;
          const res = await unpin(project, title, { socket });
          if (isErr(res)) return res;
        }

        // 今日の日付ページをピン留めする
        const { title, header, footer } = makeDiary(date);
        render(
          { type: "spinner" },
          { type: "text", text: `pin "/${project}/${title}"...` },
        );
        const res = await pin(project, title, { socket, create: true });
        if (isErr(res)) return res;

        // 今日の日付ページにtemplateを挿入する
        render(
          { type: "spinner" },
          { type: "text", text: `format "/${project}/${title}"...` },
        );
        const res2 = await patch(project, title, (lines) => [
          lines[0].text,
          ...format(
            lines.slice(1).map((line) => line.text),
            header,
            footer,
          ),
        ], { socket });
        if (isErr(res2)) return res2;

        render(
          { type: "check-circle" },
          { type: "text", text: `Pinned "/${project}/${title}".` },
        );
        await disconnect(socket);
        return createOk<void>(undefined);
      },
    );
    if (isOk(res)) return;
    const error = unwrapErr(res);
    render(
      { type: "exclamation-triangle" },
      {
        type: "text",
        text: !isString(error)
          ? `${error.name}${"message" in error && `: ${error.message}`}`
          : `SocketIO error: ${error}`,
      },
    );
    console.error(error);
  } catch (error: unknown) {
    render(
      { type: "exclamation-triangle" },
      {
        type: "text",
        text: error instanceof Error
          ? `${error.name} ${error.message}`
          : `Unknown error! (see developper console)`,
      },
    );
    console.error(error);
  } finally {
    if (socket) await disconnect(socket);
    await delay(1000);
    dispose();
  }
};
