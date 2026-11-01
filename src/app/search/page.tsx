import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SearchClient } from "./search-client";

export default async function SearchPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  return <SearchClient />;
}
