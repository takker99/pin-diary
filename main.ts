/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom"/>
import {listDiaries} from "./list.ts";
import {togglePin} from "./pin.ts";
import {getTemplate} from "./diary.ts";
import type {
  Scrapbox,
} from "https://pax.deno.dev/scrapbox-jp/types@0.0.5";
declare const scrapbox: Scrapbox;

const targetProject = 'villagepump';
const handleChange = () =>
  scrapbox.Project.name === targetProject ?
  startObserve() : endObserve();

// initialize
handleChange();
scrapbox.addListener("project:changed", handleChange);

let updateTimer: number | undefined;
async function startObserve() {
  endObserve();
  const res = await fetch("https://scrapbox.io/api/users/me");
  const {id: userId} = await res.json();
  const res2 = await fetch(`https://scrapbox.io/api/projects/${targetProject}`);
  const {id: projectId} = await res2.json();
  pinDiary(userId, projectId);
  updateTimer = setInterval(() => pinDiary(userId, projectId), 24 * 3600 * 1000);
}
function endObserve() {
  clearInterval(updateTimer);
}

async function pinDiary(userId: string, projectId: string): Promise<void> {
  // 今pinされている日付ページを調査する
  const diaryPages = await listDiaries(targetProject);
  const pinnedDiaryPages = diaryPages.filter(({pin}) => pin > 0);

  // 今日以外の日付ページを外す
  for (const page of pinnedDiaryPages) {
    if (page.title === toYYYYMMDD(new Date())) continue;

    await togglePin({userId, projectId, ...page});
  }

  const todayDiaryPage = diaryPages.find(({title}) => title === toYYYYMMDD(new Date()));

  if (!todayDiaryPage) {
    const [title, header, footer] = getTemplate(new Date());
    const a = document.createElement("a");
    a.href = `/${targetProject}/${
      encodeURIComponent(title)
    }?body=${
      encodeURIComponent([header, "", "", "", footer].join("\n"))
    }`;
    document.body.append(a);
    a.click();
    a.remove();
  await new Promise<void>(
    (resolve) => scrapbox.once("page:changed", resolve),
  );
    return await pinDiary(userId, projectId);
  }
  if (todayDiaryPage.pin > 0) return; // すでにPinされていれば何もしない
  await togglePin({userId, projectId, ...todayDiaryPage});
}

function toYYYYMMDD(date: Date) {
  return `${date.getFullYear()}/${zero(date.getMonth() + 1)}/${zero(date.getDate())}`;
}
function zero(n: number) {
  return String(n).padStart(2, '0');
}