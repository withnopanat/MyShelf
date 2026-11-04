export const th = {
  nav: {
    home: "หน้าหลัก",
    search: "ค้นหา",
    shelf: "ชั้นของฉัน",
    signOut: "ออกจากระบบ",
    themeLight: "สว่าง",
    themeDark: "มืด",
    themeSystem: "ตามระบบ",
    themeToggle: "เปลี่ยนธีม",
    accountMenu: "เมนูบัญชี",
  },
  home: {
    greeting: "สวัสดี {name}",
    comingSoon: "หน้าสแกน ISBN กำลังจะมาในเร็ว ๆ นี้",
    scanButton: "สแกน ISBN",
    manualIsbn: "พิมพ์ ISBN",
    checkIsbn: "ตรวจสอบ",
    onShelf: "มีบนชั้นแล้ว",
    notOnShelf: "ยังไม่มีบนชั้น",
    notFound: "ไม่พบหนังสือเล่มนี้",
    goShelf: "ไปที่ชั้นของฉัน",
    addManual: "เพิ่มเล่มนี้เอง",
    totalBooks: "หนังสือทั้งหมด",
    cameraNote: "ต้องใช้กล้องผ่าน https หรือ localhost เท่านั้น",
    scanning: "กำลังสแกน... เล็งกล้องไปที่บาร์โค้ด ISBN",
    stopScan: "หยุดสแกน",
  },
  search: {
    placeholder: "ค้นหาชื่อหนังสือ ผู้แต่ง หมวดหมู่ หรือ ISBN",
    typeAll: "ทุกอย่าง",
    typeTitle: "ชื่อหนังสือ",
    typeAuthor: "ผู้แต่ง",
    typeCategory: "หมวดหมู่",
    typeIsbn: "ISBN",
    searchButton: "ค้นหา",
    results: "ผลการค้นหา",
    noResults: "ไม่พบผลการค้นหา",
    empty: "พิมพ์คำค้นหาเพื่อเริ่มต้น",
    onShelfBadge: "อยู่บนชั้นแล้ว",
  },
  shelf: {
    title: "ชั้นของฉัน",
    all: "ทั้งหมด",
    empty: "ยังไม่มีหนังสือบนชั้น",
    emptyHint: "ค้นหาหรือสแกน ISBN เพื่อเพิ่มหนังสือเล่มแรกของคุณ",
    searchInShelf: "ค้นในชั้น...",
    changeStatus: "เปลี่ยนสถานะ",
    remove: "นำออกจากชั้น",
    removeConfirmTitle: "นำหนังสือออกจากชั้น?",
    removeConfirmBody: "ต้องการนำ “{title}” ออกจากชั้นของคุณใช่ไหม",
    cancel: "ยกเลิก",
    confirmRemove: "นำออก",
    countSuffix: "เล่ม",
    tags: "แท็ก",
    manualEdit: "แก้ไขข้อมูล",
    addedManually: "เพิ่มเอง",
  },
  status: {
    WANT_TO_READ: "อยากอ่าน",
    READING: "กำลังอ่าน",
    READ: "อ่านแล้ว",
  },
  detail: {
    description: "คำอธิบาย",
    publisher: "สำนักพิมพ์",
    publishedDate: "ปีที่พิมพ์",
    pageCount: "จำนวนหน้า",
    categories: "หมวดหมู่",
    noDescription: "ไม่มีคำอธิบาย",
    addTag: "เพิ่มแท็ก...",
    close: "ปิด",
    backCover: "ปกหลัง",
      otherEditions: "ปกฉบับอื่น (เรียงตามปี)",
    pickCover: "กดเพื่อใช้ปกนี้",
  },
  common: {
    add: "เพิ่ม",
    added: "เพิ่มเข้าชั้นแล้ว",
    addToShelf: "เพิ่มเข้าชั้น",
    save: "บันทึก",
    saved: "บันทึกแล้ว",
    delete: "ลบ",
    edit: "แก้ไข",
    loading: "กำลังโหลด...",
    coverAlt: "ปกหนังสือ {title}",
  },
  errors: {
    needLogin: "ต้องเข้าสู่ระบบก่อน",
    searchFailed: "ค้นหาไม่สำเร็จ ลองอีกครั้ง",
    alreadyOnShelf: "มีหนังสือเล่มนี้บนชั้นอยู่แล้ว",
    generic: "เกิดข้อผิดพลาด ลองอีกครั้ง",
    notFound: "ไม่พบรายการ",
    server: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
  },
  signin: {
    title: "MyShelf",
    subtitle: "ชั้นวางหนังสือส่วนตัวของคุณ",
    googleButton: "ล็อกอินด้วย Google",
    note: "อนุญาตเฉพาะอีเมลที่ได้รับอนุญาตเท่านั้น",
  },
} as const;

export type Dict = {
  nav: Record<keyof typeof th.nav, string>;
  home: Record<keyof typeof th.home, string>;
  search: Record<keyof typeof th.search, string>;
  shelf: Record<keyof typeof th.shelf, string>;
  status: { WANT_TO_READ: string; READING: string; READ: string };
  detail: Record<keyof typeof th.detail, string>;
  common: Record<keyof typeof th.common, string>;
  errors: Record<keyof typeof th.errors, string>;
  signin: Record<keyof typeof th.signin, string>;
};
