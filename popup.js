const SEARCH_URL = "https://data.epo.org/publication-server/publications?page=0&size=20&lng=en";
const XML_URL = "https://data.epo.org/publication-server/publications/xml";

const numberInput = document.getElementById("number");
const searchBtn = document.getElementById("search");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const totalEl = resultEl.querySelector(".total");
const descCountEl = resultEl.querySelector(".desc-count");
const claimsCountEl = resultEl.querySelector(".claims-count");

searchBtn.addEventListener("click", onSearch);
numberInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") onSearch();
});

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("error", isError);
}

async function onSearch() {
  const raw = numberInput.value;
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    setStatus("Geçerli bir patent numarası girin (ör. EP 3634453).", true);
    resultEl.style.display = "none";
    return;
  }

  searchBtn.disabled = true;
  resultEl.style.display = "none";
  setStatus("B1 yayını aranıyor…");

  try {
    const record = await findB1(digits);
    if (!record) {
      setStatus("Bu numara için B1 yayını bulunamadı.", true);
      return;
    }

    setStatus("XML indiriliyor…");
    const xmlText = await fetchXml(record.xmlFile);

    setStatus("Kelimeler sayılıyor…");
    const counts = countDocument(xmlText);

    totalEl.textContent = `${counts.total} kelime`;
    descCountEl.textContent = `${counts.description}`;
    claimsCountEl.textContent = `${counts.claims} (${counts.claimsLang || "?"})`;
    resultEl.style.display = "block";
    setStatus(`EP${digits}${record.correctionCode}B1 · ${record.publicationDate}`);
  } catch (err) {
    setStatus(`Hata: ${err.message}`, true);
  } finally {
    searchBtn.disabled = false;
  }
}

async function findB1(digits) {
  const now = new Date();
  const payload = {
    publicationNumber: digits,
    applicationNumber: null,
    ipcSymbol: null,
    publicationDateRange: {
      isRange: true,
      publicationYear: null,
      publicationWeek: null,
      publicationYearStart: 1978,
      publicationWeekStart: 51,
      publicationYearEnd: now.getFullYear(),
      publicationWeekEnd: 53
    },
    publicationKinds: ["B1"]
  };

  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Arama isteği başarısız (${res.status})`);
  const data = await res.json();
  if (!data.content || data.content.length === 0) return null;
  return data.content[0];
}

async function fetchXml(path) {
  const res = await fetch(`${XML_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`XML indirilemedi (${res.status})`);
  return res.text();
}

function countDocument(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("XML ayrıştırılamadı.");
  }

  const root = doc.documentElement;
  const procLang = root.getAttribute("lang");

  const descriptionEl = doc.querySelector("description");
  const claimsEls = Array.from(doc.querySelectorAll("claims"));
  const claimsEl =
    claimsEls.find((el) => el.getAttribute("lang") === procLang) || claimsEls[0];

  const descriptionCount = descriptionEl ? countWords(descriptionEl.textContent) : 0;
  const claimsCount = claimsEl ? countWords(claimsEl.textContent) : 0;

  return {
    description: descriptionCount,
    claims: claimsCount,
    claimsLang: claimsEl ? claimsEl.getAttribute("lang") : null,
    total: descriptionCount + claimsCount
  };
}

function countWords(text) {
  // Em-dash / en-dash Word'de ayırıcıdır (kelimeleri böler); tire (-) birleştiricidir.
  const normalized = text.replace(/[—–]/g, " ");
  const tokens = normalized.split(/[\s ]+/).filter(Boolean);
  // Yalnız noktalama/sembolden oluşan tokenlar sayılmaz; en az bir harf/rakam gerekir.
  const words = tokens.filter((tok) => /[\p{L}\p{N}]/u.test(tok));
  return words.length;
}
