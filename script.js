const startYear = 2020;
const twitterUser = "adachirei0";

function getToday(param) {
  const now = new Date();

  if (!param) return now;

  if (param === "gestern") {
    now.setDate(now.getDate() - 1);
    return now;
  }

  if (param === "morgen") {
    now.setDate(now.getDate() + 1);
    return now;
  }

  if (/^\d{4}$/.test(param)) {
    const month = parseInt(param.slice(0, 2), 10) - 1;
    const day = parseInt(param.slice(2, 4), 10);
    return new Date(now.getFullYear(), month, day);
  }

  return now;
}

function formatDateParts(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    monthStr: String(date.getMonth() + 1).padStart(2, "0"),
    dayStr: String(date.getDate()).padStart(2, "0")
  };
}

function buildXSearchURL(year, monthStr, dayStr) {
  const since = `${year}-${monthStr}-${dayStr}_00:00:00_JST`;
  const until = `${year}-${monthStr}-${dayStr}_23:59:59_JST`;
  const query = encodeURIComponent(`from:${twitterUser} since:${since} until:${until}`);
  return `https://x.com/search?q=${query}&src=typed_query&f=live`;
}

function buildFanartURL(year, month, day) {
  const baseDate = new Date(year, month - 1, day);
  baseDate.setDate(baseDate.getDate() - 6);

  const since = `${baseDate.getFullYear()}-${String(baseDate.getMonth()+1).padStart(2,"0")}-${String(baseDate.getDate()).padStart(2,"0")}_00:00:00_JST`;
  const until = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}_23:59:59_JST`;

  const query = encodeURIComponent(`url:twitter.com/${twitterUser} filter:media since:${since} until:${until}`);
  return `https://x.com/search?q=${query}`;
}

function diffLabel(currentYear, year) {
  const diff = currentYear - year;
  return diff === 0 ? "今年" : `${diff}年前`;
}

async function loadQuotes() {
  try {
    const response = await fetch("adachi-db.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("JSON loaded:", data);
    return data;

  } catch (err) {
    console.error("JSON読み込み失敗:", err);
    return {};
  }
}

function render(dateParts, quotes) {
  const { year: currentYear, month, day, monthStr, dayStr } = dateParts;

  document.getElementById("dateTitle").textContent =
    `📅${month}月${day}日`;

  document.getElementById("fanartTitle").textContent =
    `${month}月${day}日から直近7日の語録ファンアート`;

  const quoteList = document.getElementById("quoteList");
  const fanartList = document.getElementById("fanartList");

  quoteList.innerHTML = "";
  fanartList.innerHTML = "";

  for (let year = currentYear; year >= startYear; year--) {

    const label = diffLabel(currentYear, year);
    const exampleText = quotes?.[month]?.[day]?.[year];

    const quoteURL = buildXSearchURL(year, monthStr, dayStr);
    const fanartURL = buildFanartURL(year, month, day);

    // 語録
    const li = document.createElement("li");
    li.className = "list-group-item position-relative py-3";

    const a = document.createElement("a");
    a.href = quoteURL;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "stretched-link text-decoration-none fs-5";
    a.innerHTML = `⚙️ ${year}年（${label}） →`;

    li.appendChild(a);

    if (exampleText) {
      const ex = document.createElement("div");
      ex.className = "example-text";
      ex.textContent = `ex: ${exampleText}`;
      li.appendChild(ex);
    }

    quoteList.appendChild(li);

    // ファンアート
    const fanartLi = document.createElement("li");
    fanartLi.className = "list-group-item position-relative py-3";

    const fanartA = document.createElement("a");
    fanartA.href = fanartURL;
    fanartA.target = "_blank";
    fanartA.rel = "noopener noreferrer";
    fanartA.className = "stretched-link text-decoration-none fs-5";
    fanartA.innerHTML = `🖼️ ${year}年（${label}） →`;

    fanartLi.appendChild(fanartA);
    fanartList.appendChild(fanartLi);
  }
}

function setupShareButton() {
  const button = document.getElementById("shareButton");

  button.addEventListener("click", () => {
    const textToCopy =
`◯年前の足立レイ語録 (´☋｀)
${location.href}`;

    const originalText = button.textContent;
    const originalClass = button.className;

    navigator.clipboard.writeText(textToCopy).then(() => {
      button.textContent = "コピーしました！";
      button.className = "btn btn-success btn-lg";

      setTimeout(() => {
        button.textContent = originalText;
        button.className = originalClass;
      }, 1200);
    });
  });
}

(async function init() {
  const urlParams = new URLSearchParams(location.search);

  const testParam = urlParams.get("testwahlensiedasdatum");
  const dateParam = urlParams.get("wahlensiedasdatum");

  let baseDate;

  if (testParam && /^\d{8}$/.test(testParam)) {
    const y = parseInt(testParam.slice(0,4));
    const m = parseInt(testParam.slice(4,6)) - 1;
    const d = parseInt(testParam.slice(6,8));
    baseDate = new Date(y, m, d);
  } else {
    baseDate = getToday(dateParam);
  }

  const dateParts = formatDateParts(baseDate);
  const quotes = await loadQuotes();

  render(dateParts, quotes);
  setupShareButton();
})();
