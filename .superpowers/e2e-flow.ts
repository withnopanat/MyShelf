// E2E flow test ผ่าน dev server — ใช้ session ทดสอบใน DB (ลบท้ายการทดสอบ)
const BASE = "http://localhost:3000";
const COOKIE = "authjs.session-token=e2e-test-session-token";

async function req(method: string, path: string, body?: unknown) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Cookie: COOKIE,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, json };
}

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    pass++;
    console.log("PASS", name);
  } else {
    fail++;
    console.log("FAIL", name, detail ?? "");
  }
}

async function main() {
  // 1. shelf ว่างตอนแรก
  const empty = await req("GET", "/api/shelf");
  check("GET /api/shelf ว่าง", empty.status === 200 && empty.json.items.length === 0, empty.status);

  // 2. ค้นหาภาษาไทย
  const search = await req("GET", "/api/books/search?q=" + encodeURIComponent("แฮร์รี่ พอตเตอร์ กับศิลาอาถรรพ์") + "&type=text");
  const thaiBook = search.json?.books?.find((b: { language?: string }) => b.language === "th");
  check(
    "ค้นหาไทยเจอ (lang=th)",
    search.status === 200 && !!thaiBook,
    search.status + " results=" + search.json?.books?.length,
  );
  if (!thaiBook) return;

  // 3. เพิ่มเข้าชั้น
  const add = await req("POST", "/api/shelf", { book: thaiBook, status: "WANT_TO_READ" });
  check("POST /api/shelf → 201", add.status === 201, add.status);
  const itemId = add.json?.item?.id;

  // 4. เพิ่มซ้ำ → 409
  const dup = await req("POST", "/api/shelf", { book: thaiBook, status: "READ" });
  check("เพิ่มซ้ำ → 409", dup.status === 409, dup.status);

  // 5. สแกน ISBN ของเล่มที่อยู่บนชั้น → เจอ shelfItem (รวม manual-book path)
  const scan = await req("GET", "/api/books/isbn/" + thaiBook.isbn13);
  check(
    "สแกน ISBN เจอบนชั้น",
    scan.status === 200 && scan.json?.shelfItem !== null,
    JSON.stringify(scan.json?.shelfItem ? { status: scan.json.shelfItem.status } : scan.json),
  );

  // 6. เปลี่ยนสถานะ
  const patch = await req("PATCH", "/api/shelf/" + itemId, { status: "READ", tags: ["ชั้น 2 ห้องนอน"] });
  check("PATCH สถานะ+tag", patch.status === 200 && patch.json?.item?.status === "READ", patch.status);

  // 7. กรองชั้นด้วย tag
  const tagFilter = await req("GET", "/api/shelf?tag=" + encodeURIComponent("ชั้น 2 ห้องนอน"));
  check("กรองด้วย tag", tagFilter.status === 200 && tagFilter.json.items.length === 1, tagFilter.json?.items?.length);

  // 8. หน้าเว็บ render ด้วย session จริง
  const home = await fetch(BASE + "/", { headers: { Cookie: COOKIE }, redirect: "manual" });
  check("GET / → 200 (ไม่ redirect ไป signin)", home.status === 200, home.status);
  const homeHtml = await home.text();
  check("หน้าแรกมี ShelfSummary + ScanPanel", homeHtml.includes("หนังสือทั้งหมด") && homeHtml.includes("สแกน ISBN"));
  const shelfPage = await fetch(BASE + "/shelf", { headers: { Cookie: COOKIE } });
  const shelfHtml = await shelfPage.text();
  check("หน้าชั้นแสดงเล่มที่เพิ่ม", shelfHtml.includes(thaiBook.title));

  // 9. ลบออกจากชั้น
  const del = await req("DELETE", "/api/shelf/" + itemId);
  check("DELETE → 204", del.status === 204, del.status);
  const after = await req("GET", "/api/shelf");
  check("ชั้นว่างหลังลบ", after.json.items.length === 0);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

void main();
