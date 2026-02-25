const startYear = 2020;
const twitterUser = "adachirei0";

function getDateFromParam() {
  const params = new URLSearchParams(window.location.search);
  const param = params.get("wahlensiedasdatum");

  let date = new Date();

  if (param === "gestern") {
    date.setDate(date.getDate() - 1);

  } else if (param === "morgen") {
    date.setDate(date.getDate() + 1);

  } else if (/^\d{4}$/.test(param)) {
    const month = parseInt(param.substring(0, 2), 10);
    const day = parseInt(param.substring(2, 4), 10);

    const testDate = new Date(date.getFullYear(), month - 1, day);

    if (!isNaN(testDate)) {
      date = testDate;
    }
  }

  return date;
}

function format2(num) {
  return num.toString().padStart(2, "0");
}

function buildXSearchURL(year, monthStr, dayStr) {
  const since = `${year}-${monthStr}-${dayStr}_00:00:00_JST`;
  const until = `${year}-${monthStr}-${dayStr}_23:59:59_JST`;
  const query = encodeURIComponent(`from:${twitterUser} since:${since} until:${until}`);
  return `https://x.com/search?q=${query}&src=typed_query&f=live`;
}

async function loadQuotes() {
  const response = await fetch("adachi-db.json");
  return response.json();
}

function render(quotesDB, date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const currentYear = date.getFullYear();

  const monthStr = format2(month);
  const dayStr = format2(day);

  document.getElementById("dateTitle").textContent =
    `📅 ${month}月${day}日`;

  const list = document.getElementById("quoteList");
  list.innerHTML = "";

  const entry = quotesDB.find(q => q.month === month && q.day === day);

  for (let year = currentYear; year >= startYear; year--) {
    const diff = currentYear - year;
    const label = diff === 0 ? "今年" : `${diff}年前`;

    const text = entry?.[year] ?? "";

    const li = document.createElement("li");
    li.className = "list-group-item py-3";

    const a = document.createElement("a");
    a.href = buildXSearchURL(year, monthStr, dayStr);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "text-decoration-none fs-5";
    a.textContent = `⚙️ ${year}年（${label}） →`;

    li.appendChild(a);

    if (text.trim() !== "") {
      const ex = document.createElement("div");
      ex.className = "small text-muted mt-1";
      ex.textContent = `ex: ${text}`;
      li.appendChild(ex);
    }

    list.appendChild(li);
  }
}

function setupShareButton() {
  const button = document.getElementById("shareButton");

  button.addEventListener("click", () => {
    const textToCopy =
`◯年前の足立レイ語録 (´☋｀)
${window.location.href}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      const original = button.textContent;
      button.textContent = "コピーしました！";
      button.className = "btn btn-success btn-lg";

      setTimeout(() => {
        button.textContent = original;
        button.className = "btn btn-primary btn-lg";
      }, 1200);
    });
  });
}

(async function init() {
  const date = getDateFromParam();
  const quotesDB = await loadQuotes();

  render(quotesDB, date);
  setupShareButton();
})();
