// โพรบหอสมุดแห่งชาติไทย + ISBNLab — หาปก/จำนวนหน้าของ ISBN ไทย
const ISBN = "9786164788831";
const TITLE = "อาชญากรรมกับการลงทัณฑ์";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const HEADERS = { "User-Agent": UA, Accept: "text/html,application/json;q=0.9", "Accept-Language": "th-TH,th;q=0.9" };

function og(html: string): string | null {
  return html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
}

async function probe(label: string, url: string): Promise<void> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000), redirect: "follow" });
    const text = await res.text();
    console.log(`=== ${label}: HTTP ${res.status} len=${text.length} final=${res.url.slice(0, 70)}`);
    const img = og(text);
    if (img) console.log("   og:image:", img.slice(0, 110));
    if (text.includes(ISBN)) console.log("   isbn-in-page: yes");
    const sizeM = text.match(/(\d+(\.\d+)?)\s*[x×]\s*(\d+(\.\d+)?)\s*(ซม|cm)/i);
    if (sizeM) console.log("   size:", sizeM[0]);
    const pagesM = text.match(/(\d{2,4})\s*หน้า/);
    if (pagesM) console.log("   pages:", pagesM[1]);
    // JSON?
    if (/^\s*[\[{]/.test(text)) console.log("   json sample:", text.slice(0, 200).replace(/\s+/g, " "));
  } catch (e) {
    console.log(`=== ${label}: ERR`, e instanceof Error ? e.message.slice(0, 90) : e);
  }
}

async function main() {
  // National Library of Thailand — หลาย pattern
  await probe("NLT catalog search", `https://catalog.nlt.go.th/?q=${ISBN}`);
  await probe("NLT catalog search-title", `https://catalog.nlt.go.th/?q=${encodeURIComponent(TITLE)}`);
  await probe("NLT opac", `https://opac.nlt.go.th/search*tha/?searchtype=i&SEARCHARG=${ISBN}`);
  await probe("NLT website", `https://www.nlt.go.th/`);

  // ISBNLab
  await probe("isbnlab.com", `https://isbnlab.com/`);
  await probe("isbnlab api isbn", `https://api.isbnlab.com/v1/isbn/${ISBN}`);
  await probe("isbnlab search", `https://isbnlab.com/search?q=${ISBN}`);

  // เสริม: Thai National Bibliography / ThaiLIS
  await probe("thailis", `https://www.thailis.or.th/`);
}

void main();
