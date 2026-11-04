"use client";

import { useI18n } from "@/lib/i18n/i18n-provider";
import { coverPlaceholder } from "@/lib/cover";
import { cn } from "@/lib/utils";

/**
 * หนังสือ 3D (CSS 3D): ปกหน้า + สันหนังสือ + ขอบกระดาษ
 * ความหนาคำนวณจากจำนวนหน้า (~0.12 มม./หน้า) สัดส่วนตัวเล่ม 13×19 ซม. มาตรฐานหนังสือไทย
 * เล่มที่ไม่รู้จำนวนหน้าใช้ความหนาค่าเริ่มต้น 20 มม.
 * hover → หมุนตรงขึ้น (CSS var --book3d-angle-hover, transition ใน globals.css)
 */
const SIZES = {
  sm: { w: 80, h: 116 }, // การ์ดบนชั้น
  lg: { w: 176, h: 254 }, // หน้ารายละเอียด
} as const;

export type Book3DSize = keyof typeof SIZES;

export function Book3D({
  title,
  coverUrl,
  pages,
  size = "sm",
  rotationAngle = -20,
  hoverAngle = -8,
  className,
}: {
  title: string;
  coverUrl: string | null;
  pages?: number | null;
  size?: Book3DSize;
  rotationAngle?: number;
  hoverAngle?: number;
  className?: string;
}) {
  const { w, h } = SIZES[size];
  const mmPerPx = w / 130; // กว้าง 130 มม.
  const depth = Math.round(Math.min(Math.max((pages ?? 180) * 0.12, 10), 45) * mmPerPx);
  const gradientIdx = coverPlaceholder(title);

  return (
    <div
      className={cn("book3d-root relative select-none", className)}
      style={{ width: w, height: h, perspective: "900px" }}
      aria-label={`หนังสือ ${title}`}
    >
      <div
        data-testid="book3d-inner"
        className="book3d-inner relative h-full w-full"
        style={
          {
            width: w,
            height: h,
            "--book3d-angle": `${rotationAngle}deg`,
            "--book3d-angle-hover": `${hoverAngle}deg`,
          } as React.CSSProperties
        }
      >
        {/* ปกหน้า */}
        <div
          className="absolute inset-0 overflow-hidden rounded-r-[3px] rounded-l-[1px] shadow-md"
          style={{ transform: `translateZ(${depth / 2}px)` }}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gradient-to-br p-1 text-center"
              style={{
                backgroundImage: `linear-gradient(135deg, hsl(${(gradientIdx * 47 + 100) % 360} 25% 82%), hsl(${(gradientIdx * 47 + 140) % 360} 30% 62%))`,
              }}
            >
              <span className="line-clamp-3 text-[10px] font-semibold text-stone-700 sm:text-xs">{title}</span>
            </div>
          )}
        </div>

        {/* สันหนังสือ */}
        <div
          data-testid="book3d-spine"
          className="absolute left-0 top-0 overflow-hidden"
          style={{
            width: depth,
            height: "100%",
            transformOrigin: "left center",
            transform: `translateZ(${depth / 2}px) rotateY(90deg)`,
            backgroundImage: `linear-gradient(to bottom, hsl(${(gradientIdx * 47 + 100) % 360} 25% 45%), hsl(${(gradientIdx * 47 + 140) % 360} 30% 32%))`,
          }}
        >
          {depth >= 14 && (
            <span
              className="absolute inset-0 flex items-center justify-center text-center font-semibold text-white/90"
              style={{ writingMode: "vertical-rl", fontSize: Math.max(8, depth * 0.42) }}
            >
              {title.slice(0, 18)}
            </span>
          )}
        </div>

        {/* ขอบกระดาษ (ขวา) */}
        <div
          data-testid="book3d-pages"
          className="absolute right-0 top-0"
          style={{
            width: depth,
            height: "100%",
            transformOrigin: "right center",
            transform: `translateZ(${depth / 2}px) rotateY(-90deg)`,
            backgroundImage:
              "repeating-linear-gradient(to bottom, #f5f2ea 0px, #f5f2ea 1px, #e3dfd4 1px, #e3dfd4 2px)",
          }}
        />

        {/* ด้านบน (กระดาษ) */}
        <div
          className="absolute left-0 top-0 w-full"
          style={{
            height: depth,
            transformOrigin: "center top",
            transform: `translateZ(${depth / 2}px) rotateX(90deg)`,
            backgroundImage:
              "repeating-linear-gradient(to right, #f5f2ea 0px, #f5f2ea 1px, #e3dfd4 1px, #e3dfd4 2px)",
          }}
        />
      </div>
    </div>
  );
}
