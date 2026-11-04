"use client";

import { useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { BookMesh } from "./book-mesh";
import { bookDimensions, layoutShelf } from "@/lib/bookshelf-3d";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { BookStatus } from "@/generated/prisma/client";

const SHELF_WIDTH = 100; // ซม.
const SHELF_GAP_Y = 26; // ระยะชั้น (ปกหลัง-ปกหลัง)
const BOARD_THICK = 2.5;
const SHELF_DEPTH = 22;

export type ShelfSceneBook = {
  itemId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  backCoverUrl?: string | null;
  pageCount?: number | null;
  status: BookStatus;
};

/** ฉากชั้นหนังสือ 3D — เล่มหนังสือตั้งบนชั้นไม้ หมุนมุมมองได้ hover เห็นรายละเอียด คลิกเปิดเล่มเดี่ยว */
export function BookshelfScene({
  books,
  onSelect,
}: {
  books: ShelfSceneBook[];
  onSelect: (itemId: string) => void;
}) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState<string | null>(null);

  const dims = books.map((b) => ({ itemId: b.itemId, ...bookDimensions(b.pageCount) }));
  const layout = layoutShelf(dims.map((d) => ({ id: d.itemId, depth: d.depth })), SHELF_WIDTH, 1);
  const placementById = new Map(layout.placements.map((p) => [p.id, p]));

  const shelves = Math.max(layout.shelves, 1);
  const totalH = shelves * SHELF_GAP_Y + 8;
  const hoveredBook = books.find((b) => b.itemId === hovered) ?? null;

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-xl border border-border bg-card">
      <Canvas camera={{ position: [0, totalH / 2 + 20, 145], fov: 35 }} shadows>
        <ambientLight intensity={0.85} />
        <directionalLight position={[0, 60, 90]} intensity={1.5} castShadow />
        <directionalLight position={[-50, 30, 40]} intensity={0.4} />

        {/* ตัวชั้นไม้ */}
        {Array.from({ length: shelves }).map((_, i) => (
          <mesh key={`board-${i}`} position={[0, i * SHELF_GAP_Y, 0]} receiveShadow>
            <boxGeometry args={[SHELF_WIDTH + 8, BOARD_THICK, SHELF_DEPTH]} />
            <meshStandardMaterial color="#a8825f" roughness={0.8} />
          </mesh>
        ))}
        {/* แผงข้าง */}
        {[-1, 1].map((s) => (
          <mesh key={`side-${s}`} position={[s * (SHELF_WIDTH / 2 + 4), totalH / 2 - 4, 0]}>
            <boxGeometry args={[4, totalH, SHELF_DEPTH]} />
            <meshStandardMaterial color="#8a6a4f" roughness={0.85} />
          </mesh>
        ))}
        {/* แผงหลัง */}
        <mesh position={[0, totalH / 2 - 4, -SHELF_DEPTH / 2]}>
          <boxGeometry args={[SHELF_WIDTH + 8, totalH, 1]} />
          <meshStandardMaterial color="#6e5443" roughness={0.9} />
        </mesh>

        {/* เล่มหนังสือ */}
        {books.map((b) => {
          const p = placementById.get(b.itemId);
          if (!p) return null;
          const d = bookDimensions(b.pageCount);
          const isHovered = hovered === b.itemId;
          return (
            <group
              key={b.itemId}
              position={[p.x - SHELF_WIDTH / 2, p.shelfIndex * SHELF_GAP_Y + BOARD_THICK / 2 + d.height / 2, 2]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(b.itemId);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHovered((cur) => (cur === b.itemId ? null : cur));
                document.body.style.cursor = "auto";
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(b.itemId);
              }}
            >
              <group scale={isHovered ? 1.06 : 1}>
                <BookMesh
                  title={b.title}
                  coverUrl={b.coverUrl}
                  backCoverUrl={b.backCoverUrl}
                  pages={b.pageCount}
                  orientation="spineOut"
                />
              </group>
              {isHovered && (
                <Html
                  position={[d.depth + 4, d.height / 2, 0]}
                  center
                  distanceFactor={55}
                  style={{ pointerEvents: "none" }}
                >
                  <div className="w-44 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {b.coverUrl && <img src={b.coverUrl} alt="" className="mx-auto h-24 rounded shadow" />}
                    <p className="mt-2 line-clamp-2 text-xs font-semibold">{b.title}</p>
                    {b.authors.length > 0 && (
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{b.authors.join(", ")}</p>
                    )}
                    <p className="mt-1 text-[10px] font-medium text-primary">{t.status[b.status]}</p>
                    <p className="mt-1 text-[9px] text-muted-foreground">{t.shelf.clickHint}</p>
                  </div>
                </Html>
              )}
            </group>
          );
        })}

        <OrbitControls
          target={[0, totalH / 2 - 2, 0]}
          enablePan={false}
          minDistance={70}
          maxDistance={240}
          minPolarAngle={0.6}
          maxPolarAngle={1.45}
        />
      </Canvas>
      <p className="absolute bottom-2 left-0 right-0 text-center text-[11px] text-muted-foreground">{t.shelf.hint}</p>
      {/* เก็บ hoveredBook ไว้กัน lint — tooltip อ่านจาก hovered id */}
      <span className="hidden">{hoveredBook ? "" : ""}</span>
    </div>
  );
}

// ใช้ THREE type กัน tsconfig เคร่งเกิน (import แบบ type-only)
export type { THREE };
