const targetProject = 'villagepump';
let updateTimer;
const handleChange = () => {
	scrapbox.Layout === "list" && scrapbox.Project.name === targetProject ?
		startObserve() : endObserve();
}

// initialize
handleChange();
scrapbox.addListener("layout:changed", () => handleChange());
function pinDiary() {
  if (scrapbox.Layout !== "list") return;
  if (isValidPostion()) return;

  const diaryCard = getDiaryCard();

  // 一旦pin留めをリセットする
  removePin(diaryCard);

  const cards = cardList();
  // Pinしたカードの数
  // 日付ページにPinする前の数を取得しておく
  const pins = cards
    .getElementsByClassName('page-list-item grid-style-item pin')
    .length;

  // DOMにPin留めをつける
  appendPin(diaryCard);
  //日付ページが常にPinなしページの前に来るように移動する
  cards.insertBefore(diaryCard, cards.children[pins]);
}

function startObserve() {
  endObserve();
  updateTimer = setInterval(pinDiary, 1000);
}
function endObserve() {
  clearInterval(updateTimer);
}
function toYYYYMMDD(date) {
  return `${date.getFullYear()}/${zero(date.getMonth() + 1)}/${zero(date.getDate())}`;
}
function zero(n) {
  return String(n).padStart(2, '0');
}

function cardList() {
  return document
    .getElementsByClassName('page-list')?.[0]
    ?.getElementsByClassName('grid')?.[0];
}

/** 日記ページを取得する
 *
 * なければ新しく作る
 */
function getDiaryCard() {
  deleteGeneratedCards();
  const today = toYYYYMMDD(new Date());
  const path = `/${targetProject}/${encodeURIComponent(today)}`;
  const cards = cardList();

  return cards
    .querySelector(`li.page-list-item a[href="${path}"]`)
    ?.parentNode
    ?? createEmptyPageCard(today, path);
}

/** 日記ページが所定の位置にPin留めされているかどうかを調べる
 *
 * 条件
 * - `.pin`がある
 * - 最初のカードから日記ページのカードまでの間にpinなしカードが存在しない
 */
function isValidPostion() {
  const card = getDiaryCard();
  if (!card.classList.contains("pin")) return false;

  const cards = cardList();
  const length = cards.getElementsByClassName('page-list-item grid-style-item pin').length;
  for (let i = 0; i < length; i++) {
    if (!cards.children[i].classList.contains("pin")) return false;
  }
  return true;
}

function appendPin(card) {
  card.getElementsByClassName('hover')?.[0]
    ?.insertAdjacentHTML('afterend', '<div class="pin"></div>');
  card.classList.add('pin');
}
function removePin(card) {
  card.getElementsByClassName('pin')?.[0]?.remove();
  card.classList.remove('pin');
}

/** このscriptで作成したカードを全部消す */
function deleteGeneratedCards() {
  document.querySelectorAll('li[data-id="pin-diary-card"]')
    .forEach(card => card.remove());
}

function createEmptyPageCard(title, path) {
  const card = document.createElement('li');
  card.dataset.id = "pin-diary-card";
  card.classList.add("page-list-item", "grid-style-item");
  card.style.opacity = "0.7";
  card.insertAdjacentHTML('beforeend',
`<a href="${path}" rel="route">
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
</a>`);
  return card;
}
 scrapbox.on('project:changed', () => {
 	//トップページからトップページに移動してもlayout:changedは呼ばれないので、ここでhandleChangeをかける
 	handleChange()
 })