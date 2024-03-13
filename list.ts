export interface PageMetaData {
  title: string;
  pin: number;
  pageId: string;
  commitId: string;
};
interface Page {
  title: string;
  pin: number;
  id: string;
  commitId: string;
}

export async function listDiaries(project: string) {
  const pages = await fetchPages(project);
  return pages.flatMap(page => /\d{4}\/\d{2}\/\d{2}/.test(page.title) ?
    [{pageId: page.id, title: page.title, commitId: page.commitId, pin: page.pin}] :
    []
  );
}

async function fetchPages(project: string) {
  const res = await fetch(
    `https://scrapbox.io/api/pages/${project}?limit=1`
  );
  const { count: pageNum } = await res.json();
  const limitParam = Math.min(pageNum, 1000); // APIで一度に取得するページ数
  const maxIndex = Math.floor(pageNum / 1000) + 1; // APIを叩く回数

  // 一気にAPIを叩いてページ情報を取得する
  const results = await Promise.all(
    [...Array(maxIndex).keys()]
      .map(async (index) => {
        const response = await fetch(
          `/api/pages/${
            project
          }/?limit=${
            limitParam
          }&skip=${index * 1000}`
        );
        const { pages }: {pages: Page[];} = await response.json();
        return pages;
      })
  );

  return results.flat();
}