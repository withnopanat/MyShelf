// เช็กแหล่งปกไทยที่เหลือ: salmonbooks / libraryhouse / openlibrary ด้วย ISBN จริง
const ISBN = "9786164788831";

async function check(label: string, url: string, parse: (t: string) => string | null): Promise<void> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0", Accept: "application/json,text/html" },
      signal: AbortSignal.timeout(10_000),
    });
    const text = res.ok ? await res.text() : `HTTP ${res.status}`;
    console.log(label, "->", parse(text) ?? `ok=${res.ok} len=${text.length}`);
  } catch (e) {
    console.log(label, "-> ERR:", e instanceof Error ? e.message.slice(0, 60) : e);
  }
}

async function main() {
  await check(
    "salmonbooks (ISBN)",
    `https://salmonbooks.net/wp-json/wc/store/v1/products?search=${ISBN}&per_page=5`,
    (t) => {
      try {
        const items = JSON.parse(t) as Array<{ name: string; images?: Array<{ src: string }> }>;
        return items.length ? items.map((i) => `${i.name.slice(0, 40)} | ${i.images?.[0]?.src?.slice(0, 50) ?? "no-img"}`).join(" ;; ") : "empty[]";
      } catch {
        return "not-json";
      }
    },
  );
  await check(
    "salmonbooks (ชื่อ)",
    `https://salmonbooks.net/wp-json/wc/store/v1/products?search=${encodeURIComponent("อาชญากรรมกับการลงทัณฑ์")}&per_page=5`,
    (t) => {
      try {
        const items = JSON.parse(t) as Array<{ name: string }>;
        return items.length ? items.map((i) => i.name.slice(0, 40)).join(" ;; ") : "empty[]";
      } catch {
        return "not-json";
      }
    },
  );
  await check("openlibrary", `https://openlibrary.org/isbn/${ISBN}.json`, (t) => (t.includes("cover") ? "HAS record" : t.slice(0, 60)));
  await check("openlibrary-cover", `https://covers.openlibrary.org/b/isbn/${ISBN}-M.jpg?default=false`, (t) => `len=${t.length}`);
}

void main();
