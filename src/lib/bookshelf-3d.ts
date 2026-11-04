/**
 * logic บริสุทธิ์สำหรับฉากชั้นหนังสือ 3D (three.js)
 * หน่วยทั้งหมดเป็น "ซนติเมตร" — 1 หน่วย scene = 1 ซม.
 */

export type BookDims = { width: number; height: number; depth: number };

/** สัดส่วนมาตรฐานหนังสือไทย 13×19 ซม. ความหนาจากจำนวนหน้า (~0.11 มม./หน้า) */
export function bookDimensions(pageCount: number | null): BookDims {
  const depth = pageCount === null ? 20 : Math.min(Math.max(pageCount * 0.11, 9), 45);
  return { width: 13, height: 19, depth };
}

export type ShelfPlacement = { id: string; x: number; shelfIndex: number };

/**
 * จัดเล่มแนวตั้งเรียงซ้าย→ขวา ล้นความกว้างไปชั้นถัดไป
 * shelfWidthCm: ความกว้างใช้งานของชั้น, bookGapCm: ช่องว่างระหว่างเล่ม
 * margin ซ้าย-ขวา 2 ซม.
 */
export function layoutShelf(
  books: Array<{ id: string; depth: number }>,
  shelfWidthCm: number,
  bookGapCm: number,
): { shelves: number; placements: ShelfPlacement[] } {
  const MARGIN = 2;
  const usable = shelfWidthCm - MARGIN * 2;

  const placements: ShelfPlacement[] = [];
  let shelfIndex = 0;
  let cursor = MARGIN;

  for (const book of books) {
    const slot = Math.min(book.depth, usable); // เล่มกว้างเกินชั้น → วางเดี่ยว ๆ
    if (cursor + slot > shelfWidthCm - MARGIN && cursor > MARGIN) {
      shelfIndex++;
      cursor = MARGIN;
    }
    placements.push({ id: book.id, x: cursor + slot / 2, shelfIndex });
    cursor += slot + bookGapCm;
  }

  return { shelves: Math.max(shelfIndex + 1, books.length > 0 ? 1 : 0), placements };
}
