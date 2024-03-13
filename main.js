const targetProject = 'villagepump';
let VERBOSE = false;
let executed = false;
let diaryCard = null;

export function execute({verbose = false} = {}) {
  if (executed) return;
  executed = true;
  VERBOSE = verbose;

  const today = toYYYYMMDD(new Date());
  const path = `/${targetProject}/${encodeURIComponent(today)}`
  handlePageChange(async () => {
    // top page以外では実行しない
    if (scrapbox.Project.name !== targetProject && scrapbox.Layout === 'list') return;

    // 全てのカードを含む<ul>
    const cards = document
      .getElementsByClassName('page-list')?.[0]
      ?.getElementsByClassName('grid')?.[0];

    // ページの並び替えが終わるまで少し待つ
    await sleep(1000);

    // 前回の日付ページに相当するカードのPinを外す
    if(diaryCard) {
      _log('Removing a pin from %o \n href = %o', diaryCard, diaryCard.querySelector('a').href);
      removePin({card: diaryCard});
      _log('Removed.');
    }
    // 日付ページを取得する
    diaryCard = cards
      .querySelector(`li.page-list-item a[href="${path}"]`)
      ?.parentNode
      // なければ新しく作る
      ?? (() => {
        _log('The diary card doesn\'t exist. Creating new diary card...');
        return createEmptyPageCard({title: today, path: path});
      })();
    _log({diaryCard});

    // Pinしたカードの数
    // 日付ページにPinする前の数を取得しておく
    const pins = cards
      .getElementsByClassName('page-list-item grid-style-item pin')
      .length;
    _log({pins});

    // DOMにPin留めをつける
    _log('Adding a pin on %o \n href = %o', diaryCard, diaryCard.querySelector('a').href);
    appendPin({card: diaryCard});
    _log('Added a pin on the diary card.');
    //日付ページが常にPinなしページの前に来るように移動する
    _log('Move the diary card before %o', cards.children[pins]);
    cards.insertBefore(diaryCard, cards.children[pins]);
    console.log('Finish pinning the today\'s diary page.')
  });
}

const zero = n => String(n).padStart(2, '0');
const toYYYYMMDD =
  date => `${date.getFullYear()}/${zero(date.getMonth() + 1)}/${zero(date.getDate())}`
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function createEmptyPageCard({title, path}) {
  const card = document.createElement('li');
  card.insertAdjacentHTML('beforeend',
`<li id="pin-diary-card" class="page-list-item grid-style-item" style="opacity: 0.7;">
  <a href="${path}" rel="route">
    <div class="hover"></div>
    <div class="content">
      <div class="header">
        <div class="title">${title}</div>
      </div>
      <div class="description">
        <div class="line-img">
          <div></div><div></div><div></div><div></div><div></div>
        </div>
      </div>
    </div>
  </a>
</li>`);
  return card;
}
function appendPin({card}) {
  card.getElementsByClassName('hover')?.[0]
    ?.insertAdjacentHTML('afterend', '<div class="pin"></div>');
  card.classList.add('pin');
}
function removePin({card}) {
  card.getElementsByClassName('pin')?.[0]?.remove();
  card.classList.remove('pin');
}
function handlePageChange(callback) {
  callback(); // 初回の実行
  const observer = new MutationObserver(() => callback());

  // 監視を開始する
  observer.observe(document.getElementsByTagName('title')[0], {childList: true});
  observer.observe(document.getElementById('dropdownMenuSort'),
    // この３つを指定しないと変更を捕捉できない
    {subtree: true,childList:true,characterData:true});
};
function _log(message, ...objects) {
  if (!VERBOSE) return;
  const header = '[pin-diary]';
  if (objects.length !== 0) {
    if ((typeof message) === 'string') {
      console.log(`${header}${message}`, ...objects);
    } else {
      console.log(header, message, ...objects);
    }
  } else {
    if ((typeof message) === 'string') {
      console.log(`${header}${message}`);
    } else {
      console.log(header, message);
    }
  }
}