import { listPages, BasePage } from "./deps.ts";

export async function* listPinnedDiaries(project: string): AsyncGenerator<BasePage> {
  for await (const page of listPinnedPages(project)) {
    if (!/\d{4}\/\d{2}\/\d{2}/.test(page.title)) continue;
    yield page;
  }
}

/** 全てのピン留めされたページを取得する */
async function* listPinnedPages(project: string, skip = 0): AsyncGenerator<BasePage> {
  const { count, pages } = await ensureList(project, skip);
  for (const page of pages) {
    if (page.pin === 0) continue;
    yield page;
  }
  if ((pages.at(-1)?.pin ?? 0) === 0) return;
  yield* listPinnedPages(project, skip + 1000);
}

async function ensureList(project: string, skip: number) {
  const result = await listPages(project, { limit: 1000, skip });
  // login errorなどは全部例外として扱う
  if (!result.ok) {
    const error = new Error();
    error.name = result.value.name;
    error.message = result.value.message;
    throw error;
  }

  return result.value;
}
