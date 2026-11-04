// โพรบรอบสอง: NLT หลายโดเมน + isbnlab หา path หนังสือ
const ISBN = "9786164788831";
const TITLE = "อาชญากรรมกับการลงทัณฑ์";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const HEADERS = { "User-Agent": UA, Accept: "text/html,application/json;q=0.9", "Accept-Language": "th-TH,th;q=0.9" };

function og(html: string): string | null {
  return html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
}

async function probe(label: string, url: string): Promise<void> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12_000), redirect: "follow" });
    const text = await res.text();
    console.log(`=== ${label}: HTTP ${res.status} len=${text.length} final=${res.url.slice(0, 75)}`);
    const img = og(text);
    if (img) console.log("   og:image:", img.slice(0, 110));
    if (text.includes(ISBN)) console.log("   isbn-in-page: yes");
    const pagesM = text.match(/(\d{2,4})\s*หน้า/);
    if (pagesM) console.log("   pages:", pagesM[1]);
    if (/^\s*[\[{]/.test(text)) console.log("   json:", text.slice(0, 180).replace(/\s+/g, " "));
    return;
  } catch (e) {
    console.log(`=== ${label}: ERR`, e instanceof Error ? e.message.slice(0, 70) : e);
  }
}

async function main() {
  // NLT catalog variants
  await probe("http opac.nlt", `http://opac.nlt.go.th/search*tha/?searchtype=i&SEARCHARG=${ISBN}`);
  await probe("search.nlt", `https://search.nlt.go.th/?q=${ISBN}`);
  await probe("library.nlt", `https://library.nlt.go.th/?q=${ISBN}`);

  // isbnlab — หา search form จากหน้าแรก
  try {
    const res = await fetch("https://www.isbnlab.com/", { headers: HEADERS, signal: AbortSignal.timeout(12_000) });
    const t = await res.text();
    const form = t.match(/<form[^>]+action=["']([^"']+)["']/i)?.[1];
    const input = t.match(/<input[^>]+name=["']([^"']+)["'][^>]*type=["']search["']/i)?.[1] ?? t.match(/<input[^>]+type=["']search["'][^>]*name=["']([^"']+)["']/i)?.[1];
    console.log("isbnlab form action:", form, "| search input name:", input);
    const links = [...new Set([...t.matchAll(/href="(\/[^"]*book[^"]*)"/gi)].map((m) => m[1]))].slice(0, 5);
    console.log("book links:", links.join(" | "));
  } catch (e) {
    console.log("isbnlab form ERR:", e instanceof Error ? e.message.slice(0, 60) : e);
  }
  await probe("isbnlab /book/ISBN", `https://www.isbnlab.com/book/${ISBN}`);
  await probe("isbnlab /th/book/ISBN", `https://www.isbnlab.com/th/book/${ISBN}`);
  await probe("isbnlab api-ish", `https://www.isbnlab.com/api/search?q=${ISBN}`);
}

void main();
