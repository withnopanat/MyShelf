// โพรบรอบสอง — เช็ก platform จริง + ลอง path ที่ถูกต้อง
const ISBN = "9786164788831";
const TITLE = "อาชญากรรมกับการลงทัณฑ์";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/json;q=0.9",
  "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
};

async function get(label: string, url: string, note?: (t: string, res: Response) => void): Promise<void> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000), redirect: "follow" });
    const text = await res.text();
    console.log(`=== ${label}: HTTP ${res.status} len=${text.length}`);
    const markers: Array<[string, RegExp]> = [
      ["shopify", /cdn\.shop|Shopify\.theme|shopify\.js/],
      ["magento", /Magento|mage\/|skin\/frontend/],
      ["btwice", /btwcdn|bytwice/],
      ["wordpress", /wp-content/],
    ];
    for (const [name, re] of markers) {
      if (re.test(text)) console.log(`   platform hint: ${name}`);
    }
    if (note) note(text, res);
  } catch (e) {
    console.log(`=== ${label}: ERR`, e instanceof Error ? e.message.slice(0, 90) : e);
  }
}

async function main() {
  await get("asiabooks root", "https://www.asiabooks.com/", (t, res) => {
    const search = t.match(/action=["']([^"']*search[^"']*)["']/i)?.[1];
    if (search) console.log("   search form action:", search.slice(0, 100));
    const name = t.match(/<title>([^<]+)<\/title>/i)?.[1];
    console.log("   title:", name?.slice(0, 80), "| final:", res.url.slice(0, 70));
  });
  await get("asiabooks shopify-search (ISBN)", `https://www.asiabooks.com/search?q=${ISBN}`);
  await get("asiabooks shopify-search (title)", `https://www.asiabooks.com/search?q=${encodeURIComponent(TITLE)}`);
  await get("kinokuniya TH root", "https://th.kinokuniya.com/");
  await get("kinokuniya global", "https://www.kinokuniya.co.jp/");
  await probeTitle("kinokuniya SG/TH item", `https://singapore.kinokuniya.com/bw/9786164788831`);
}

async function probeTitle(label: string, url: string): Promise<void> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000), redirect: "follow" });
    const text = await res.text();
    const og = text.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
    console.log(`=== ${label}: HTTP ${res.status} og:${og ? og.slice(0, 100) : "none"}`);
  } catch (e) {
    console.log(`=== ${label}: ERR`, e instanceof Error ? e.message.slice(0, 90) : e);
  }
}

void main();
