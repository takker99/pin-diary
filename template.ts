import {
  type CodeBlockError,
  type FetchError,
  getCodeBlock,
} from "@cosense/std/rest";
import { createOk, isErr, type Result, unwrapOk } from "option-t/plain_result";
import { expand } from "./expand.ts";

/**
 * Represents a template used to format a diary page.
 */
export interface Template {
  /** the diary page title */
  title: string;
  /** the diary page header */
  header: string;
  /** the diary page footer */
  footer: string;
}

/**
 * Represents a expanded template used to format a diary page.
 */
export interface ExpandedTemplate {
  /** the diary page title */
  title: string;
  /** the diary page header */
  header: string[];
  /** the diary page footer */
  footer: string[];
}

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
  makeDiary: (date: Date) => ExpandedTemplate;

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
 * @internal
 * Load a template from a page `[/project/title]`
 */
export const load = async (
  project: string,
  title: string,
): Promise<Result<Template, CodeBlockError | FetchError>> => {
  const titleRes = await getCodeBlock(project, title, "title");
  if (isErr(titleRes)) return titleRes;
  const header = await getCodeBlock(project, title, "header");
  if (isErr(header)) return header;
  const footer = await getCodeBlock(project, title, "footer");
  if (isErr(footer)) return footer;

  return createOk({
    title: unwrapOk(titleRes),
    header: unwrapOk(header),
    footer: unwrapOk(footer),
  });
};

/**
 * @internal
 * Convert {@linkcode Template} to {@linkcode DiaryMaker}
 */
export const makeDiaryMaker = (
  template: Template,
): DiaryMaker => ({
  makeDiary: (date) => ({
    title: expand(date, template.title)[0],
    header: expand(date, template.header),
    footer: expand(date, template.footer),
  }),
  isOldDiary: (title, today) => expand(today, title)[0] !== title,
});
