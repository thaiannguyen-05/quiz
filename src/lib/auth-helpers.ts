import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/utils";

type UserInput = {
  email: string;
  name?: string | null;
  image?: string | null;
};

export async function getOrCreateUser(input: UserInput) {
  const email = normalizeEmail(input.email);

  return db.user.upsert({
    where: { email },
    update: {
      name: input.name ?? undefined,
      image: input.image ?? undefined,
    },
    create: {
      email,
      name: input.name ?? null,
      image: input.image ?? null,
    },
  });
}

export const getCurrentUser = cache(async () => {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) return null;

  return getOrCreateUser({
    email,
    name: session.user?.name,
    image: session.user?.image,
  });
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
