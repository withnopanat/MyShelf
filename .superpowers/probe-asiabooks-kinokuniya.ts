// โพรบ asiabooks.co.th กับ kinokuniya (th) — หาว่าหยิบปกด้วย ISBN/ชื่อได้ไหม
const ISBN = "9786164788831";
const TITLE = "อาชญากรรมกับการลงทัณฑ์";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/json;q=0.9",
  "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
};

function ogImage(html: string): string | null {
  return (
    html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ??
    null
  );
}

async function probe(label: string, url: string): Promise<void> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000), redirect: "follow" });
    const text = await res.text();
    const img = ogImage(text);
    console.log(`=== ${label}: HTTP ${res.status} len=${text.length} final=${res.url.slice(0, 70)}`);
    if (img) console.log("   og:image:", img.slice(0, 110));
    if (/97[89]\d{10}/.test(text)) console.log("   isbn-in-page: yes");
    const links = [...new Set([...text.matchAll(/href="(https?:\/\/[^"]*\/(?:product|catalog\/product|products)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 3);
    if (links.length) console.log("   product links:", links.map((l) => l.slice(0, 85)).join(" || "));
  } catch (e) {
    console.log(`=== ${label}: ERR`, e instanceof Error ? e.message.slice(0, 80) : e);
  }
}

async function main() {
  await probe("asiabooks search (ISBN)", `https://www.asiabooks.com/catalogsearch/result/?q=${ISBN}`);
  await probe("asiabooks search (title)", `https://www.asiabooks.com/catalogsearch/result/?q=${encodeURIComponent(TITLE)}`);
  await probe("kinokuniya TH search (ISBN)", `https://th.kinokuniya.com/th/Search/?q=${ISBN}`);
  await probe("kinokuniya TH search (title)", `https://th.kinokuniya.com/th/Search/?q=${encodeURIComponent(TITLE)}`);
}

void main();
