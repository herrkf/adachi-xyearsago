const startYear = 2020;
const twitterUser = "adachirei0";

function getDateFromParams() {
    const params = new URLSearchParams(window.location.search);
    const today = new Date();

    if (params.has("wahlensiedasdatum")) {
        const val = params.get("wahlensiedasdatum");

        if (val === "gestern") {
            today.setDate(today.getDate() - 1);

        } else if (val === "morgen") {
            today.setDate(today.getDate() + 1);

        } else if (/^\d{4}$/.test(val)) {
            const month = parseInt(val.substring(0, 2), 10) - 1;
            const day = parseInt(val.substring(2, 4), 10);
            today.setMonth(month);
            today.setDate(day);
        }
    }

    return today;
}

function pad(num) {
    return num.toString().padStart(2, "0");
}

function buildXSearchUrl(year, monthStr, dayStr) {
    const since = `${year}-${monthStr}-${dayStr}_00:00:00_JST`;
    const until = `${year}-${monthStr}-${dayStr}_23:59:59_JST`;
    const query = encodeURIComponent(`from:${twitterUser} since:${since} until:${until}`);
    return `https://x.com/search?q=${query}&src=typed_query&f=live`;
}

function buildFanartUrl(year, month, day) {
    const target = new Date(year, month - 1, day);
    target.setDate(target.getDate() - 6);

    const since = `${target.getFullYear()}-${pad(target.getMonth()+1)}-${pad(target.getDate())}_00:00:00_JST`;
    const until = `${year}-${pad(month)}-${pad(day)}_23:59:59_JST`;

    const query = encodeURIComponent(
        `url:twitter.com/${twitterUser} filter:media since:${since} until:${until}`
    );

    return `https://x.com/search?q=${query}`;
}

async function loadData() {
    const res = await fetch("data.json");
    return await res.json();
}

function render() {
    const date = getDateFromParams();

    const currentYear = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const monthStr = pad(month);
    const dayStr = pad(day);

    document.getElementById("dateTitle").textContent = `📅${month}月${day}日`;
    document.getElementById("fanartTitle").textContent = `${month}月${day}日`;

    loadData().then(data => {

        const yearList = document.getElementById("yearList");
        const fanartList = document.getElementById("fanartList");

        for (let year = currentYear; year >= startYear; year--) {

            const diff = currentYear - year;
            const label = diff === 0 ? "今年" : `${diff}年前`;

            const exampleText =
                data?.[month]?.[day]?.[year] ?? "";

            const url = buildXSearchUrl(year, monthStr, dayStr);

            const li = document.createElement("li");
            li.className = "list-group-item position-relative py-3";

            li.innerHTML = `
                <a href="${url}"
                   class="stretched-link text-decoration-none fs-5"
                   target="_blank">
                   ⚙️ ${year}年（${label}） →
                </a>
                ${exampleText ? `<br>ex: ${exampleText}` : ""}
            `;

            yearList.appendChild(li);

            // fanart
            const fanartUrl = buildFanartUrl(year, month, day);

            const liFanart = document.createElement("li");
            liFanart.className = "list-group-item position-relative py-3";

            liFanart.innerHTML = `
                <a href="${fanartUrl}"
                   class="stretched-link text-decoration-none fs-5"
                   target="_blank">
                   🖼️ ${year}年（${label}） →
                </a>
            `;

            fanartList.appendChild(liFanart);
        }
    });

    document.getElementById("shareButton").addEventListener("click", function () {

        const textToCopy =
`◯年前の足立レイ語録 (´☋｀)
${window.location.href}`;

        const button = this;
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

render();
