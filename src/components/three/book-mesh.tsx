"use client";

import { useMemo } from "react";
import * as THREE from "three";
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

  const pagesMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: pagesTex, roughness: 0.9 }),
    [pagesTex],
  );
  const spineMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: spineTex, roughness: 0.85 }),
    [spineTex],
  );
  const coverMat = useMemo(
    () =>
      frontTex
        ? new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.7 })
        : new THREE.MeshStandardMaterial({
            color: new THREE.Color(`hsl(${hue} 32% 62%)`),
            roughness: 0.7,
          }),
    [frontTex, hue],
  );
  const backMat = useMemo(
    () =>
      backTex
        ? new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.7 })
        : new THREE.MeshStandardMaterial({ map: plainTex, roughness: 0.85 }),
    [backTex, plainTex, hue],
  );

  // ลำดับ material ของ BoxGeometry: [+x, -x, +y, -y, +z, -z]
  const spineOutMats = useMemo(
    () => [pagesMat, pagesMat, pagesMat, pagesMat, spineMat, pagesMat],
    [pagesMat, spineMat],
  );
  const coverOutMats = useMemo(
    () => [spineMat, pagesMat, pagesMat, pagesMat, coverMat, backMat],
    [spineMat, pagesMat, coverMat, backMat],
  );

  const args = orientation === "spineOut" ? [depth, height, width] : [width, height, depth];
  const mats = orientation === "spineOut" ? spineOutMats : coverOutMats;

  return (
    <mesh castShadow>
      <boxGeometry args={args as [number, number, number]} />
      <meshStandardMaterial attach="material-0" {...mats[0]} />
      <meshStandardMaterial attach="material-1" {...mats[1]} />
      <meshStandardMaterial attach="material-2" {...mats[2]} />
      <meshStandardMaterial attach="material-3" {...mats[3]} />
      <meshStandardMaterial attach="material-4" {...mats[4]} />
      <meshStandardMaterial attach="material-5" {...mats[5]} />
    </mesh>
  );
}
