"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { toProxyCoverUrl } from "@/lib/cover-proxy";

/** โหลด texture ปกผ่าน proxy ภายใน (เลี่ยง CORS) — โหลดไม่ได้ → คืน null ให้ fallback เป็นสี */
export function useCoverTexture(url: string | null | undefined): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const proxied = toProxyCoverUrl(url);
    if (!proxied) {
      setTexture(null);
      return;
    }
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      proxied,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      },
      undefined,
      () => {
        if (!cancelled) setTexture(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  return texture;
}
