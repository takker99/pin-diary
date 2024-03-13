import { listPages, BasePage } from "./deps.ts";

/** 全てのピン留めされたページを取得する */
export async function* listPinnedPages(project: string, skip = 0): AsyncGenerator<BasePage> {
  const { count, pages } = await ensureList(project, skip);
  for (const page of pages) {
    if (page.pin === 0) continue;
    yield page;
  }
  // pinしたページこれ以上ないときは終了
  if ((pages.at(-1)?.pin ?? 0) === 0) return;
  yield* listPinnedPages(project, skip + 1000);
}

const ensureList = async (project: string, skip: number) => {
  const result = await listPages(project, {
    limit: 1000,
    skip,
  });
  // login errorなどは全部例外として扱う
  if (!result.ok) {
    const error = new Error();
    error.name = result.value.name;
    error.message = result.value.message;
    throw error;
  }

  return result.value;
};