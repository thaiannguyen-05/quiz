import type { Metadata } from "next";

import { LibrariesView } from "@/components/libraries/libraries-view";
import { requireUser } from "@/lib/auth-helpers";
import { loadLibraries } from "@/lib/query/server-data";

export const metadata: Metadata = { title: "Libraries" };

export default async function LibrariesPage() {
  const user = await requireUser();
  const libraries = await loadLibraries();

  const firstName =
    user.name?.trim().split(/\s+/)[0] || user.email.split("@")[0];

  return <LibrariesView initialLibraries={libraries} firstName={firstName} />;
}
