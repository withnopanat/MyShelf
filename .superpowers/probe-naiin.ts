// โพรบ naiin.com — หาวิธีหยิบปกจาก ISBN
const ISBN = "9786164788831";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";

async function main() {
  const targets: Array<[string, string]> = [
    ["search-html", `https://www.naiin.com/search?type=1&keyword=${ISBN}`],
    ["search-html-title", `https://www.naiin.com/search?type=1&keyword=${encodeURIComponent("อาชญากรรมกับการลงทัณฑ์")}`],
    ["api-json", `https://api.naiin.com/json/book/isbn/${ISBN}`],
  ];

  for (const [label, url] of targets) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html,application/json;q=0.9" },
        signal: AbortSignal.timeout(12_000),
        redirect: "follow",
      });
      const text = await res.text();
      console.log(`=== ${label}: HTTP ${res.status}, len=${text.length}`);
      const og = text.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
        ?? text.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];
      if (og) console.log("   og:image:", og.slice(0, 90));
      const titles = [...text.matchAll(/<h3[^>]*class="[^"]*txt-title[^"]*"[^>]*>([^<]+)<\/h3>/gi)].slice(0, 3).map((m) => m[1].trim());
      if (titles.length) console.log("   titles:", titles.join(" | "));
      const anyIsbn = text.match(/97[89]\d{10}/)?.[0];
      if (anyIsbn) console.log("   isbn-in-page:", anyIsbn);
    } catch (e) {
      console.log(`=== ${label}: ERR`, e instanceof Error ? e.message.slice(0, 80) : e);
    }
  }
}

void main();
