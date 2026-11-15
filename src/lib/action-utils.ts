import { Prisma } from "@prisma/client";

export type ActionFailure = {
  ok: false;
  error: string;
  code?: string;
};

export function failure(error: string, code?: string): ActionFailure {
  return { ok: false, error, code };
}

export function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
