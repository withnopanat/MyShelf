import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("ต้องเข้าสู่ระบบก่อน");
    this.name = "UnauthorizedError";
  }
}

/** ดึง user id จาก session — โยน UnauthorizedError ถ้าไม่ได้ล็อกอิน */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new UnauthorizedError();
  return id;
}
