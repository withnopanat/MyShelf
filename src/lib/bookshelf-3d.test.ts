import { describe, expect, it } from "vitest";
import { bookDimensions, layoutShelf } from "@/lib/bookshelf-3d";

describe("bookDimensions", () => {
  it("สัดส่วนมาตรฐาน 13×19 ซม. และความหนาจากจำนวนหน้า (0.11 มม./หน้า = 0.011 ซม.)", () => {
    const d = bookDimensions(330);
    expect(d.width).toBeCloseTo(13);
    expect(d.height).toBeCloseTo(19);
    expect(d.depth).toBeCloseTo(3.63, 2);
  });

  it("เล่มบางมาก → ไม่ต่ำกว่า 0.9 ซม.", () => {
    expect(bookDimensions(32).depth).toBeCloseTo(0.9);
  });

  it("เล่มหนามาก → ไม่เกิน 4.5 ซม.", () => {
    expect(bookDimensions(900).depth).toBeCloseTo(4.5);
  });

  it("ไม่รู้จำนวนหน้า → 2 ซม.", () => {
    expect(bookDimensions(null).depth).toBeCloseTo(2);
  });
});

describe("layoutShelf", () => {
  const b = (id: string, depth: number) => ({ id, depth });

  it("เรียงจากซ้ายไปขวาบนชั้นเดียวถ้าพอ", () => {
    const r = layoutShelf([b("a", 20), b("b", 25), b("c", 30)], 100, 1);
    expect(r.shelves).toBe(1);
    expect(r.placements.map((p) => p.id)).toEqual(["a", "b", "c"]);
    // a: x = 2(margin) + 10, b: x = 2+20+1 + 12.5
    expect(r.placements[0].x).toBeCloseTo(12);
    expect(r.placements[1].x).toBeCloseTo(23 + 12.5);
    expect(r.placements[0].shelfIndex).toBe(0);
  });

  it("ล้นความกว้าง → ไปชั้นถัดไป", () => {
    const r = layoutShelf([b("a", 60), b("b", 60)], 100, 1);
    expect(r.shelves).toBe(2);
    expect(r.placements[0].shelfIndex).toBe(0);
    expect(r.placements[1].shelfIndex).toBe(1);
    expect(r.placements[1].x).toBeCloseTo(32); // 2 + 60/2
  });

  it("ชั้นมี margin ซ้าย-ขวา (2 ซม.) — เล่มเดียววางกลางชั้น", () => {
    const r = layoutShelf([b("a", 30)], 100, 1);
    expect(r.placements[0].x).toBeCloseTo(2 + 15);
  });

  it("เล่มกว้างเกินชั้น → วางเดี่ยว ๆ บนชั้นของตัวเอง", () => {
    const r = layoutShelf([b("wide", 120), b("normal", 20)], 100, 1);
    expect(r.shelves).toBe(2);
    expect(r.placements[0].shelfIndex).toBe(0);
    expect(r.placements[1].shelfIndex).toBe(1);
  });
});
