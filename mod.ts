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
import { delay } from "@std/async/delay";
import { isString } from "@core/unknownutil/is/string";
import { format } from "./format.ts";
import { listPinnedPages } from "./list.ts";
import {
  andThenAsyncForResult,
  createOk,
  isErr,
  isOk,
  type Result,
  unwrapErr,
  unwrapOk,
} from "option-t/plain_result";
import type { Socket } from "socket.io-client";
import {
  type CodeBlockError,
  type FetchError,
  getCodeBlock,
} from "@cosense/std/rest";
import { expand } from "./expand.ts";
export { format } from "./format.ts";
export { expand } from "./expand.ts";

declare const scrapbox: Scrapbox;

/**
 * Represents a template used to format a diary page.
 */
export interface Template {
  /** the diary page title */
  title: string;
  /** the diary page header */
  header: string[];
  /** the diary page footer */
  footer: string[];
}

/**
 * parameters for {@linkcode launch}
 */
export type DiaryInit = (DiaryMaker | TemplateLocation) & DiaryCommonOptions;

/**
 * Represents functions used to create and format diary pages.
 *
 * This is good for creating a diary template programmatically.
 * If you want to create a just simple diary template or to modify it without updating the script, use {@linkcode TemplateLocation} instead.
 */
export interface DiaryMaker {
  /** 与えられた日付の日記ページのテンプレートを作る
   *
   * > [!NOTE]
   * > {@linkcode launch}はplaceholdersを処理しない。
   * > 予め{@linkcode expand}でplaceholdersを展開したテンプレートを与えること。
   */
  makeDiary: (date: Date) => Template;

  /** 今日以外の日記ページかどうかを判断する函数
   *
   * @param title 判断対象のページタイトル
   * @param today 今日の日付
   * @param 今日以外の日記ページなら`true`, それ以外のページは `false`
   */
  isOldDiary: (title: string, today: Date) => boolean;
}

/**
 * Represents a location of a page which includes a diary template.
 */
export interface TemplateLocation {
  /** the project name of the diary temlate
   *
   * If it is not set, those which is passed to {@linkcode launch} or {@linkcode pinDiary} will be used.
   */
  project?: string;

  /** the title of the diary template page */
  title: string;
}

/**
 * Options for {@linkcode launch}
 */
export interface DiaryCommonOptions {
  /** 日記ページの更新間隔 (ms) */
  interval?: number;
}

/**
 * Start pin-diary
 *
 * @param project - The name of the project to pin diary pages
 * @param init - parameters for pin-diary
 * @returns a function to stop pin-diary
 */
export const launch = (project: string, init: DiaryInit): () => void => {
  const interval = init.interval ?? 24 * 3600 * 1000;

  let updateTimer: number | undefined;

  const startObserve = async () => {
    endObserve();
    await pinDiary(project, new Date(), init);
    updateTimer = setInterval(
      () => pinDiary(project, new Date(), init),
      interval,
    );
  };
  const endObserve = () => clearInterval(updateTimer);

  const handleChange = () =>
    scrapbox.Project.name === project ? startObserve() : endObserve();
  handleChange();
  scrapbox.addListener("project:changed", handleChange);

  return () => {
    endObserve();
    scrapbox.removeListener("project:changed", handleChange);
  };
};

const makeDiaryMaker = async (
  project: string,
  template: TemplateLocation,
): Promise<Result<DiaryMaker, CodeBlockError | FetchError>> => {
  const title = await getCodeBlock(
    template.project ?? project,
    template.title,
    "title",
  );
  if (isErr(title)) return title;
  const header = await getCodeBlock(
    template.project ?? project,
    template.title,
    "header",
  );
  if (isErr(header)) return header;
  const footer = await getCodeBlock(
    template.project ?? project,
    template.title,
    "footer",
  );
  if (isErr(footer)) return footer;

  return createOk({
    makeDiary: (date) => ({
      title: expand(date, unwrapOk(title))[0],
      header: expand(date, unwrapOk(header)),
      footer: expand(date, unwrapOk(footer)),
    }),
    isOldDiary: (title, today) => expand(today, title)[0] !== title,
  });
};

/**
 * Pin [/`project`/`date`] and format it with the template
 *
 * To understand the syntax of the template, see the example of {@linkcode expand}
 *
 * @example
 * ```ts ignore
 * import { pinDiary } from "./mod.ts";
 * import { parse } from "./parse.ts";
 * import { lightFormat } from "date-fns";
 *
 * await pinDiary("my-project", new Date(), {
 *   makeDiary: (date) => ({
 *     title: lightFormat(date, "yyyy-MM-dd"),
 *     header: [],
 *     footer: [parse(date, "[@yyyy-MM-dd-1@] ← [@yyyy-MM-dd@] → [@yyyy-MM-dd+1@]")],
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
  init: DiaryMaker | TemplateLocation,
): Promise<void> => {
  const { render, dispose } = useStatusBar();
  let socket: ScrapboxSocket | undefined;
  try {
    let diaryMaker: DiaryMaker;
    if ("title" in init) {
      const res = await makeDiaryMaker(project, init);
      if (isOk(res)) {
        diaryMaker = unwrapOk(res);
      } else {
        const error = unwrapErr(res);
        const text = `Failed to load template from /${
          init.project ?? project
        }/${init.title}.\nPlease make sure this page includes the following 3 code blocks: "title", "header", and "footer".`;

        render({ type: "exclamation-triangle" }, { type: "text", text });
        console.error(text, error);
        return;
      }
    } else {
      diaryMaker = init;
    }
    const { makeDiary, isOldDiary } = diaryMaker;

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
