import { listPages, type ListPagesOption } from "@cosense/std/rest";
import type { BasePage } from "@cosense/types/rest";
import { isErr, unwrapOk } from "option-t/plain_result";
export type { BasePage, ListPagesOption };

/**
 * Retrieves all pinned pages one by one for `project`
 *
 * @example List all pages in a project
 * ```ts ignore
 * import { listPinnedPages } from "./list.ts";
 *
 * for await (const page of listPinnedPages("takker")) {
 *   console.log(`${page.title}: ${page.descriptions.join(" ").slice(0, 50)}...`);
 * }
 * ```
 *
 * @param project - The name of the project to retrieve pinned pages from.
 * @param options - Options for `/api/pages/{project}`
 * @returns An async iterable of pinned pages.
 */
export async function* listPinnedPages(
  project: string,
  options?: Omit<ListPagesOption, "sort" | "skip">,
): AsyncGenerator<BasePage, void, unknown> {
  let skip = 0;
  const limit = options?.limit ?? 100;
  while (true) {
    const result = await listPages(project, {
      ...options,
      limit,
      sort: "updated",
      skip,
    });
    if (isErr(result)) return;
    const pages = unwrapOk(result).pages;
    for (const page of pages) {
      if (page.pin === 0) continue;
      yield page;
    }
    const lastPage = pages.at(-1);
    if ((lastPage?.pin ?? 0) > 0) return;
    skip += limit;
  }
}
