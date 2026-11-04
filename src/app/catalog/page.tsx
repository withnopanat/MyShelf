import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CatalogClient } from "./catalog-client";

export default async function CatalogPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const books = await prisma.book.findMany({
    where: { source: "library-house" },
    orderBy: { title: "asc" },
  });

  return <CatalogClient books={books.map((b) => ({ ...b }))} />;
}
