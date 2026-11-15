"use server";

import { revalidatePath } from "next/cache";

import { failure, isUniqueConstraintError } from "@/lib/action-utils";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { firstZodError, nameSchema } from "@/lib/validation";

export type CreateSubjectResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createSubject(input: {
  libraryId: string;
  name: string;
}): Promise<CreateSubjectResult> {
  const user = await requireUser();
  const parsed = nameSchema.safeParse(input.name);

  if (!parsed.success) {
    return failure(firstZodError(parsed.error));
  }

  const library = await db.library.findFirst({
    where: { id: input.libraryId, ownerId: user.id },
    select: { id: true },
  });

  if (!library) {
    return failure("Library not found.");
  }

  try {
    const subject = await db.subject.create({
      data: { libraryId: library.id, name: parsed.data },
      select: { id: true },
    });

    revalidatePath("/libraries");
    revalidatePath(`/libraries/${library.id}`);

    return { ok: true, id: subject.id };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return failure("A subject with that name already exists in this library.");
    }
    throw error;
  }
}

export async function renameSubject(input: {
  id: string;
  name: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const parsed = nameSchema.safeParse(input.name);

  if (!parsed.success) {
    return failure(firstZodError(parsed.error));
  }

  const subject = await db.subject.findFirst({
    where: { id: input.id, library: { ownerId: user.id } },
    select: { id: true, libraryId: true },
  });

  if (!subject) {
    return failure("Subject not found.");
  }

  try {
    await db.subject.update({
      where: { id: subject.id },
      data: { name: parsed.data },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return failure("A subject with that name already exists in this library.");
    }
    throw error;
  }

  revalidatePath("/libraries");
  revalidatePath(`/libraries/${subject.libraryId}`);
  revalidatePath(`/libraries/${subject.libraryId}/subjects/${subject.id}`);

  return { ok: true };
}

export async function deleteSubject(input: {
  id: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();

  const subject = await db.subject.findFirst({
    where: { id: input.id, library: { ownerId: user.id } },
    select: { id: true, libraryId: true },
  });

  if (!subject) {
    return failure("Subject not found.");
  }

  await db.subject.delete({ where: { id: subject.id } });

  revalidatePath("/libraries");
  revalidatePath(`/libraries/${subject.libraryId}`);

  return { ok: true };
}
