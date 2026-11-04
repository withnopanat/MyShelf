"use client";

import { useMemo } from "react";
import { useCoverTexture } from "./use-cover-texture";
import { makePagesTexture, makePlainTexture, makeSpineTexture, titleHue } from "./textures";
import { bookDimensions } from "@/lib/bookshelf-3d";

export type BookMeshOrientation = "spineOut" | "coverOut";

/**
 * กล่องหนังสือ 3D ในฉาก three.js
 * - spineOut: หันสันหนังสือออกหากล้อง (ใช้บนชั้น — กล่อง = [หนา, สูง, กว้าง13])
 * - coverOut: หันปกออกหากล้อง (ใช้ในหน้าดูเล่มเดี่ยว — กล่อง = [กว้าง13, สูง, หนา])
 */
export function BookMesh({
  title,
  coverUrl,
  backCoverUrl,
  pages,
  orientation = "spineOut",
}: {
  title: string;
  coverUrl: string | null;
  backCoverUrl?: string | null;
  pages?: number | null;
  orientation?: BookMeshOrientation;
}) {
  const { width, height, depth } = bookDimensions(pages);
  const hue = useMemo(() => titleHue(title), [title]);

  const frontTex = useCoverTexture(coverUrl);
  const backTex = useCoverTexture(backCoverUrl);
  const spineTex = useMemo(() => makeSpineTexture(title, orientation === "spineOut" ? depth : width, height), [title, depth, width, orientation]);
  const pagesTex = useMemo(() => makePagesTexture(), []);
  const plainTex = useMemo(() => makePlainTexture(hue), [hue]);

  const coverColor = `hsl(${hue} 32% 62%)`;
  const backColor = `hsl(${hue} 28% 34%)`;

  // ลำดับ material ของ BoxGeometry: [+x, -x, +y, -y, +z, -z]
  // key บังคับ remount เมื่อ texture มาทีหลัง — กัน shader เก่าที่ไม่มี map
  const spineOut = (
    <>
      <meshStandardMaterial key={`f-${frontTex ? 1 : 0}`} attach="material-0" map={frontTex ?? undefined} color={coverColor} roughness={0.7} />
      <meshStandardMaterial key={`b-${backTex ? 1 : 0}`} attach="material-1" map={backTex ?? plainTex} color={backColor} roughness={0.85} />
      <meshStandardMaterial attach="material-2" map={pagesTex} roughness={0.9} />
      <meshStandardMaterial attach="material-3" map={pagesTex} roughness={0.9} />
      <meshStandardMaterial attach="material-4" map={spineTex} roughness={0.85} />
      <meshStandardMaterial attach="material-5" map={pagesTex} roughness={0.9} />
    </>
  );

  const coverOut = (
    <>
      <meshStandardMaterial attach="material-0" map={spineTex} roughness={0.85} />
      <meshStandardMaterial attach="material-1" map={pagesTex} roughness={0.9} />
      <meshStandardMaterial attach="material-2" map={pagesTex} roughness={0.9} />
      <meshStandardMaterial attach="material-3" map={pagesTex} roughness={0.9} />
      <meshStandardMaterial key={`f-${frontTex ? 1 : 0}`} attach="material-4" map={frontTex ?? undefined} color={coverColor} roughness={0.7} />
      <meshStandardMaterial key={`b-${backTex ? 1 : 0}`} attach="material-5" map={backTex ?? plainTex} color={backColor} roughness={0.85} />
    </>
  );

  const args = orientation === "spineOut" ? [depth, height, width] : [width, height, depth];

  return (
    <mesh castShadow>
      <boxGeometry args={args as [number, number, number]} />
      {orientation === "spineOut" ? spineOut : coverOut}
    </mesh>
  );
}
