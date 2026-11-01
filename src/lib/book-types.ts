/** ชนิดข้อมูลหนังสือที่ normalize แล้ว — client-safe (ไม่พึ่ง Prisma/Google API) */
export type NormalizedBook = {
  googleBooksId: string | null;
  title: string;
  subtitle: string | null;
  authors: string[];
  categories: string[];
  isbn10: string | null;
  isbn13: string | null;
  coverUrl: string | null;
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  pageCount: number | null;
  language: string | null;
};
