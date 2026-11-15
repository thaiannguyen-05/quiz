export const queryKeys = {
  libraries: ["libraries"] as const,
  libraryOptions: ["library-options"] as const,
  library: (libraryId: string) => ["library", libraryId] as const,
  subjects: (libraryId: string) => ["subject", libraryId] as const,
  subject: (libraryId: string, subjectId: string) =>
    ["subject", libraryId, subjectId] as const,
};
