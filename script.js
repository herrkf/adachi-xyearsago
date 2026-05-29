const startYear = 2020;
const twitterUser = "adachirei0";
const dbPath = ".data/adachi-db.json";
const jstOffsetMs = 9 * 60 * 60 * 1000;

function createJstDateParts(year, month, day) {
  return {
    year,
    month,
    day,
    monthStr: String(month).padStart(2, "0"),
    dayStr: String(day).padStart(2, "0")
  };
}

function getJstPartsFromTimestamp(timestamp) {
  const jstDate = new Date(timestamp + jstOffsetMs);
  return createJstDateParts(
    jstDate.getUTCFullYear(),
    jstDate.getUTCMonth() + 1,
    jstDate.getUTCDate()
  );
}

function getCurrentJstParts() {
  return getJstPartsFromTimestamp(Date.now());
}

function getJstMidnightTimestamp(year, month, day) {
  return Date.UTC(year, month - 1, day) - jstOffsetMs;
}

function getToday(param) {
  const nowParts = getCurrentJstParts();

  if (!param) return nowParts;

  if (param === "gestern") {
    return getJstPartsFromTimestamp(
      getJstMidnightTimestamp(nowParts.year, nowParts.month, nowParts.day) -
      (24 * 60 * 60 * 1000)
    );
  }

  if (param === "morgen") {
    return getJstPartsFromTimestamp(
      getJstMidnightTimestamp(nowParts.year, nowParts.month, nowParts.day) +
      (24 * 60 * 60 * 1000)
    );
  }

  if (/^\d{4}$/.test(param)) {
    const month = parseInt(param.slice(0, 2), 10);
    const day = parseInt(param.slice(2, 4), 10);
    return createJstDateParts(nowParts.year, month, day);
  }

  return nowParts;
}

function formatSearchDateFromTimestamp(timestamp, time = "00:00:00") {
  const parts = getJstPartsFromTimestamp(timestamp);
  return `${parts.year}-${parts.monthStr}-${parts.dayStr}_${time}`;
}

function buildXSearchURL(year, monthStr, dayStr) {
  const baseTimestamp = getJstMidnightTimestamp(year, Number(monthStr), Number(dayStr));
  const sinceTimestamp = baseTimestamp - (6 * 60 * 60 * 1000);

  const since = `${formatSearchDateFromTimestamp(sinceTimestamp)}_JST`;
  const until = `${year}-${monthStr}-${dayStr}_23:59:59_JST`;
  const query = encodeURIComponent(
    `from:${twitterUser} since:${since} until:${until}`
  );

  return `https://x.com/search?q=${query}&src=typed_query&f=live`;
}

function buildFanartURL(year, month, day) {
  const baseTimestamp = getJstMidnightTimestamp(year, month, day);
  const sinceTimestamp = baseTimestamp - (6 * 24 * 60 * 60 * 1000);
  const sinceParts = getJstPartsFromTimestamp(sinceTimestamp);

  const since = `${sinceParts.year}-${sinceParts.monthStr}-${sinceParts.dayStr}_00:00:00_JST`;
  const until = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}_23:59:59_JST`;
  const query = encodeURIComponent(
    `url:twitter.com/${twitterUser} filter:media since:${since} until:${until}`
  );

  return `https://x.com/search?q=${query}`;
}

function diffLabel(currentYear, year) {
  const diff = currentYear - year;
  return diff === 0 ? "今年" : `${diff}年前`;
}

function getYearData(quotes, month, day, year) {
  return quotes?.[String(month)]?.[String(day)]?.[String(year)] ?? null;
}

async function loadQuotes() {
  const response = await fetch(dbPath);
  if (!response.ok) {
    throw new Error(`Failed to load ${dbPath}: ${response.status}`);
  }
  return response.json();
}

function renderTweetEmbeds() {
  if (window.twttr?.widgets) {
    window.twttr.widgets.load();
  }
}

function render(dateParts, quotes) {
  const { year: currentYear, month, day, monthStr, dayStr } = dateParts;

  document.getElementById("dateTitle").textContent =
    `📅${month}月${day}日`;

  document.getElementById("fanartTitle").textContent =
    `${month}月${day}日から直近7日の語録ファンアート`;

  document.getElementById("pickupTitle").textContent =
    `📅 ${month}月${day}日の過去のポストPICKUP`;

  const quoteList = document.getElementById("quoteList");
  const fanartList = document.getElementById("fanartList");
  const pickupList = document.getElementById("pickupList");

  quoteList.innerHTML = "";
  fanartList.innerHTML = "";
  pickupList.innerHTML = "";

  let hasEmbed = false;

  for (let year = currentYear; year >= startYear; year--) {
    const label = diffLabel(currentYear, year);
    const yearData = getYearData(quotes, month, day, year);
    const exampleText = yearData?.text ?? "";
    const postId = yearData?.id ?? null;

    const quoteURL = buildXSearchURL(year, monthStr, dayStr);
    const fanartURL = buildFanartURL(year, month, day);

    // ===== 語録 =====
    const li = document.createElement("li");
    li.className = "list-group-item position-relative py-3";

    const a = document.createElement("a");
    a.href = quoteURL;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "stretched-link text-decoration-none fs-5";
    a.textContent = `⚙️ ${year}年（${label}） →`;

    li.appendChild(a);

    if (exampleText !== "") {
      const ex = document.createElement("div");
      ex.className = "example-text";
      ex.textContent = `ex: ${exampleText}`;
      li.appendChild(ex);
    }

    quoteList.appendChild(li);

    // ===== ファンアート =====
    const fanartLi = document.createElement("li");
    fanartLi.className = "list-group-item position-relative py-3";

    const fanartA = document.createElement("a");
    fanartA.href = fanartURL;
    fanartA.target = "_blank";
    fanartA.rel = "noopener noreferrer";
    fanartA.className = "stretched-link text-decoration-none fs-5";
    fanartA.textContent = `🖼️ ${year}年（${label}） →`;

    fanartLi.appendChild(fanartA);
    fanartList.appendChild(fanartLi);

    // ===== PICKUP =====
    if (postId) {
      hasEmbed = true;

      const wrapper = document.createElement("div");
      wrapper.className = "tweet-card-wrapper";
      wrapper.style.maxWidth = "550px";

      const heading = document.createElement("div");
      heading.className = "text-muted mb-2 fs-6 fw-bold";
      heading.textContent = `📌 ${year}年（${label}）`;

      const blockquote = document.createElement("blockquote");
      blockquote.className = "twitter-tweet";
      blockquote.dataset.width = "550";
      blockquote.dataset.theme = "light";
      blockquote.dataset.lang = "ja";

      const tweetLink = document.createElement("a");
      tweetLink.href = `https://twitter.com/${twitterUser}/status/${postId}`;

      blockquote.appendChild(tweetLink);
      wrapper.appendChild(heading);
      wrapper.appendChild(blockquote);
      pickupList.appendChild(wrapper);
    }
  }

  if (!hasEmbed) {
    const empty = document.createElement("p");
    empty.className = "text-muted";
    empty.textContent = "この日の登録済みポストはありません。";
    pickupList.appendChild(empty);
  }

  renderTweetEmbeds();
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
    const y = parseInt(testParam.slice(0, 4), 10);
    const m = parseInt(testParam.slice(4, 6), 10);
    const d = parseInt(testParam.slice(6, 8), 10);
    baseDate = createJstDateParts(y, m, d);
  } else {
    baseDate = getToday(dateParam);
  }

  setupShareButton();

  try {
    const quotes = await loadQuotes();
    render(baseDate, quotes);
  } catch (error) {
    console.error(error);
    document.getElementById("quoteList").innerHTML =
      '<li class="list-group-item text-danger">語録データを読み込めませんでした。</li>';
  }
})();
