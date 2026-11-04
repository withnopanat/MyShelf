"use client";

import * as THREE from "three";

/** hash ชื่อเรื่อง → hue (เดียวกับ coverPlaceholder) */
export function titleHue(title: string): number {
  return [...title].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
}

/** สันหนังสือ: พื้นสีเข้ม + ชื่อเรื่องแนวตั้ง (หมุนข้อความ 90°) */
export function makeSpineTexture(title: string, w: number, h: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(32, Math.round(w));
  canvas.height = Math.round(h);
  const ctx = canvas.getContext("2d")!;
  const hue = titleHue(title);
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, `hsl(${hue} 30% 42%)`);
  grad.addColorStop(1, `hsl(${(hue + 40) % 360} 32% 28%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const fontPx = Math.max(11, Math.min(20, canvas.width * 0.55));
  ctx.font = `600 ${fontPx}px "IBM Plex Sans Thai", "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillText(title.slice(0, 22), 0, 0, canvas.height - 8);
  ctx.restore();
  // แถบไฮไลต์ขอบสัน
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(0, 0, 2, canvas.height);
  ctx.fillRect(canvas.width - 2, 0, 2, canvas.height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** ขอบกระดาษ: เส้นขนานเลียนแบบรอยหน้ากระดาษ */
export function makePagesTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f5f2ea";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#ddd8c9";
  ctx.lineWidth = 1;
  for (let y = 1; y < 128; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** ปกหลังสีเรียบ (ใช้เมื่อไม่มีรูปปกหลัง) */
export function makePlainTexture(hue: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = `hsl(${hue} 28% 34%)`;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
