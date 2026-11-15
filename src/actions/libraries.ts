"use server";

import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { firstZodError, nameSchema } from "@/lib/validation";
import { failure } from "@/lib/action-utils";

export type CreateLibraryResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createLibrary(input: {
  name: string;
}): Promise<CreateLibraryResult> {
  const user = await requireUser();
  const parsed = nameSchema.safeParse(input.name);

  if (!parsed.success) {
    return failure(firstZodError(parsed.error));
  }

  const library = await db.library.create({
    data: { name: parsed.data, ownerId: user.id },
    select: { id: true },
  });

  return { ok: true, id: library.id };
}

export async function renameLibrary(input: {
  id: string;
  name: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const parsed = nameSchema.safeParse(input.name);

  if (!parsed.success) {
    return failure(firstZodError(parsed.error));
  }

  const existing = await db.library.findFirst({
    where: { id: input.id, ownerId: user.id },
    select: { id: true },
  });

  if (!existing) {
    return failure("Library not found.");
  }

  await db.library.update({
    where: { id: existing.id },
    data: { name: parsed.data },
  });

  return { ok: true };
}

export async function deleteLibrary(input: {
  id: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();

  const result = await db.library.deleteMany({
    where: { id: input.id, ownerId: user.id },
  });

  if (result.count === 0) {
    return failure("Library not found.");
  }

  return { ok: true };
}
