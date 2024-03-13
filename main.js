const targetProject = 'villagepump';

const handlePageChange = callback => {
  callback()
  let path = null
  const handleObserve = (mutations) => {
      // 全部実行する必要はないので、１個だけ取り出す
      if (scrapbox.Project.name !== targetProject)  return

      // URLが変わったときだけ実行する
      if (location.pathname !== path) callback()

      path = location.pathname
  }
  const observer1 = new MutationObserver(handleObserve);

  observer1.observe(document.querySelector('title'), { childList: true })
}

const $ = (query, parent = document) => parent.querySelector(query)
const $$ = query => [...document.querySelectorAll(query)]
const zero = n => String(n).padStart(2, '0');
const timestamp = date => `${date.getFullYear()}/${zero(date.getMonth() + 1)}/${zero(date.getDate())}`

const today = timestamp(new Date());
const path = `/${targetProject}/${encodeURIComponent(today)}`

handlePageChange(() => {
  // トップページ以外では実行しない
  if (location.pathname.slice(1, -1) !== targetProject) return

  const pinCards = $$('.page-list-item.grid-style-item.pin')
  const [actualLastPin, lastPin] = pinCards.slice(pinCards.length - 2)
  console.log('lastPin: %o',lastPin)
  // 日付ページを移動する
  const diary = $(`.page-list-item a[href="${path}"]`)?.parentNode
  console.log('The diary page card: %o',diary)
  // pinの最後が日付ページだったらつけ直す
  if (actualLastPin && (lastPin ?? actualLastPin) === diary) {
    console.log('The diary page card is already pinned.');
    console.log('actualLastPin: %o',actualLastPin)
    actualLastPin?.after(lastPin);
    console.log('Finish pinning the today\'s diary page.')
    return;
  }
  if (diary) {
    diary.classList.add('pin');
    // pinを作る
    const pinMark = document.createElement('div');
    pinMark.classList.add('pin');
    $('.hover', diary).after(pinMark)
    (lastPin ?? actualLastPin)?.after(diary)
  } else {
    console.log('No diary page card found. Creating it....')
    lastPin?.insertAdjacentHTML('afterend', `
      <li class="page-list-item grid-style-item pin" style="opacity: 0.7;">
        <a href="${path}" rel="route">
          <div class="hover"></div>
          <div class="pin"></div>
          <div class="content">
            <div class="header">
              <div class="title">${today}</div>
            </div>
            <div class="description"></div>
          </div>
        </a>
      </li>`)
  }
  console.log('Finish pinning the today\'s diary page.')
});