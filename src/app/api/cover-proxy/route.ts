import { NextResponse } from "next/server";
import { COVER_HOSTS } from "@/lib/cover-proxy";

/** proxy รูปปกจาก host ที่อนุญาต — ให้ three.js texture โหลดได้โดยไม่ติด CORS */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "ต้องระบุ url" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "url ไม่ถูกต้อง" }, { status: 400 });
  }
  if (!COVER_HOSTS.includes(target.hostname)) {
    return NextResponse.json({ error: "host ไม่อนุญาต" }, { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: `ดึงรูปไม่สำเร็จ (${upstream.status})` }, { status: 502 });
    }
    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "ไม่ใช่ไฟล์รูป" }, { status: 415 });
    }
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("GET /api/cover-proxy failed:", error);
    return NextResponse.json({ error: "ดึงรูปไม่สำเร็จ" }, { status: 502 });
  }
}
