"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { commitImport } from "@/actions/import";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import {
  createCsvTemplate,
  parseQuizFile,
  subjectNameFromFileName,
  type CsvParseResult,
} from "@/lib/csv";
import { applyImportToCache } from "@/lib/query/cache";
import type { LibraryOption } from "@/lib/query/types";
import { cn } from "@/lib/utils";

type ImportDialogProps = {
  open: boolean;
  onClose: () => void;
  libraries: LibraryOption[];
  defaultLibraryId: string;
  defaultSubjectName?: string;
  lockLibrary?: boolean;
  lockSubjectName?: boolean;
  currentSubjectId?: string;
};

type ConflictState = {
  existingSubjectId: string;
  existingQuestionCount: number;
};

const LETTERS = ["A", "B", "C", "D"];

function downloadTemplate() {
  const blob = new Blob([createCsvTemplate()], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "quizdeck-template.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ImportDialog(props: ImportDialogProps) {
  if (!props.open) return null;
  return <ImportDialogContent {...props} />;
}

function ImportDialogContent({
  onClose,
  libraries,
  defaultLibraryId,
  defaultSubjectName,
  lockLibrary = false,
  lockSubjectName = false,
  currentSubjectId,
}: ImportDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"pick" | "preview">("pick");
  const [libraryId, setLibraryId] = useState(defaultLibraryId);
  const [file, setFile] = useState<File | null>(null);
  const [subjectName, setSubjectName] = useState(defaultSubjectName ?? "");
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [included, setIncluded] = useState<Set<number>>(new Set());
  const [parsing, setParsing] = useState(false);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const validQuestions = useMemo(
    () => parseResult?.questions.filter((question) => question.errors.length === 0) ?? [],
    [parseResult],
  );

  const selectedQuestions = useMemo(
    () => validQuestions.filter((question) => included.has(question.rowNumber)),
    [validQuestions, included],
  );

  const attentionCount = useMemo(
    () =>
      parseResult?.questions.filter((question) => question.errors.length > 0)
        .length ?? 0,
    [parseResult],
  );

  const allValidSelected =
    validQuestions.length > 0 && selectedQuestions.length === validQuestions.length;

  const importMutation = useMutation({
    mutationFn: commitImport,
    onSuccess: (result, variables) => {
      if (result.ok) {
        applyImportToCache(queryClient, variables.libraryId, {
          ...result,
          mode: variables.mode,
        });
        toast.success(
          `Imported ${variables.questions.length} question${
            variables.questions.length === 1 ? "" : "s"
          } into “${result.subjectName}”`,
        );
        onClose();
        if (!currentSubjectId || result.subjectId !== currentSubjectId) {
          router.push(
            `/libraries/${variables.libraryId}/subjects/${result.subjectId}`,
          );
        }
        return;
      }

      if (result.code === "NAME_EXISTS" && result.existingSubjectId) {
        setConflict({
          existingSubjectId: result.existingSubjectId,
          existingQuestionCount: result.existingQuestionCount ?? 0,
        });
        return;
      }

      toast.error(result.error);
    },
    onError: () => {
      toast.error("The import failed. Please try again.");
    },
  });

  const committing = importMutation.isPending;

  async function handleFile(nextFile: File | undefined) {
    if (!nextFile) return;
    if (!nextFile.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please choose a .csv file.");
      return;
    }

    setFile(nextFile);
    setParsing(true);
    setConflict(null);

    try {
      const result = await parseQuizFile(nextFile);
      setParseResult(result);
      if (!lockSubjectName) {
        setSubjectName(subjectNameFromFileName(nextFile.name));
      }
      setIncluded(
        new Set(
          result.questions
            .filter((question) => question.errors.length === 0)
            .map((question) => question.rowNumber),
        ),
      );
      setStep("preview");
    } catch {
      toast.error("Could not read that file. Try exporting the CSV again.");
    } finally {
      setParsing(false);
    }
  }

  function toggleRow(rowNumber: number) {
    setIncluded((previous) => {
      const next = new Set(previous);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
    setConflict(null);
  }

  function toggleAll() {
    setIncluded(
      allValidSelected
        ? new Set()
        : new Set(validQuestions.map((question) => question.rowNumber)),
    );
    setConflict(null);
  }

  function resetFile() {
    setStep("pick");
    setFile(null);
    setParseResult(null);
    setIncluded(new Set());
    setConflict(null);
    setSubjectName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function submitImport(mode?: "new" | "replace" | "append") {
    if (!parseResult || selectedQuestions.length === 0) {
      toast.error("Select at least one valid question.");
      return;
    }
    if (!subjectName.trim()) {
      toast.error("Give the subject a name.");
      return;
    }

    setConflict(null);

    importMutation.mutate({
      libraryId,
      subjectName: subjectName.trim(),
      mode,
      questions: selectedQuestions.map((question) => ({
        text: question.text,
        answers: question.answers,
        correctIndices: question.correctIndices,
        timeLimit: question.timeLimit,
      })),
    });
  }

  return (
    <Modal
      open
      onClose={committing ? () => undefined : onClose}
      title="Import questions from CSV"
      description="Blooket-style files work out of the box. Review every row before it is saved."
      size="xl"
      dismissible={!committing}
    >
      {step === "pick" ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="import-library">Library</Label>
              <select
                id="import-library"
                value={libraryId}
                onChange={(event) => setLibraryId(event.target.value)}
                className="h-11 w-full rounded-xl border border-line-strong bg-white px-3 text-sm font-medium text-ink shadow-[inset_0_1px_1px_rgba(29,26,51,0.02)] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
                disabled={parsing || lockLibrary}
              >
                {libraries.map((library) => (
                  <option key={library.id} value={library.id}>
                    {library.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-end">
              <Button type="button" variant="secondary" onClick={downloadTemplate}>
                <Download className="size-4" />
                Download template
              </Button>
            </div>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              void handleFile(event.dataTransfer.files?.[0]);
            }}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition",
              dragActive
                ? "border-brand bg-brand-soft/60"
                : "border-line-strong bg-[#fbfaff] hover:border-brand/40 hover:bg-brand-soft/30",
            )}
          >
            <span className="grid size-16 place-items-center rounded-2xl bg-white text-brand shadow-[0_12px_30px_-16px_rgba(29,26,51,0.4)]">
              {parsing ? (
                <Spinner className="size-6" />
              ) : (
                <FileUp className="size-7" />
              )}
            </span>
            <p className="mt-4 text-base font-extrabold">
              {parsing ? "Reading your CSV…" : "Drop your CSV here"}
            </p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-soft">
              Or choose a file from your computer. The first sheet should contain
              Question Text, Answer 1–4, Time Limit, and Correct Answer(s).
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => void handleFile(event.target.files?.[0])}
              disabled={parsing}
            />
            <Button
              type="button"
              variant="soft"
              className="mt-5"
              onClick={() => inputRef.current?.click()}
              disabled={parsing}
            >
              <FileSpreadsheet className="size-4" />
              Choose a CSV file
            </Button>
          </div>

          <div className="rounded-2xl border border-line bg-white/70 p-4">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-faint">
              <Sparkles className="size-3.5 text-brand" />
              What gets imported
            </p>
            <div className="mt-2 grid gap-2 text-xs leading-relaxed text-ink-soft sm:grid-cols-2">
              <p>
                <span className="font-bold text-ink">Question Text</span> and at
                least two answers.
              </p>
              <p>
                <span className="font-bold text-ink">Correct Answer(s)</span> such
                as <code className="font-mono">2</code> or{" "}
                <code className="font-mono">1,3</code>.
              </p>
              <p>
                <span className="font-bold text-ink">Time Limit</span> in seconds
                (1–300). Blank defaults to 40.
              </p>
              <p>
                Blank rows, the extra title row, and trailing empty rows are
                ignored.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-[#fbfaff] p-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="import-subject-name">Subject name</Label>
              <Input
                id="import-subject-name"
                value={subjectName}
                maxLength={80}
                onChange={(event) => {
                  setSubjectName(event.target.value);
                  setConflict(null);
                }}
                disabled={committing || lockSubjectName}
              />
            </div>
            <div className="space-y-1.5 sm:w-56">
              <Label htmlFor="import-library-preview">Library</Label>
              <select
                id="import-library-preview"
                value={libraryId}
                onChange={(event) => {
                  setLibraryId(event.target.value);
                  setConflict(null);
                }}
                className="h-11 w-full rounded-xl border border-line-strong bg-white px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
                disabled={committing || lockLibrary}
              >
                {libraries.map((library) => (
                  <option key={library.id} value={library.id}>
                    {library.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={resetFile}
              disabled={committing}
            >
              <RefreshCw className="size-4" />
              Change file
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">
              <FileSpreadsheet className="size-3" />
              {file?.name}
            </Badge>
            <Badge tone="mint">
              {validQuestions.length} ready
            </Badge>
            {attentionCount > 0 ? (
              <Badge tone="coral">
                {attentionCount} need{attentionCount === 1 ? "s" : ""} attention
              </Badge>
            ) : null}
            {parseResult?.headerRowNumber ? (
              <Badge tone="neutral">
                Header found on row {parseResult.headerRowNumber}
              </Badge>
            ) : null}
          </div>

          {parseResult?.fileErrors.length ? (
            <div className="rounded-2xl border border-coral/25 bg-coral-soft/70 p-4">
              <p className="flex items-center gap-2 text-sm font-extrabold text-[#8b2b3a]">
                <AlertCircle className="size-4" />
                This file cannot be imported yet
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[#8b2b3a]">
                {parseResult.fileErrors.map((error) => (
                  <li key={error}>• {error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {parseResult?.warnings.length ? (
            <div className="rounded-2xl border border-sun/25 bg-sun-soft/70 p-3.5">
              <ul className="space-y-1 text-xs leading-relaxed text-[#8a5d00]">
                {parseResult.warnings.map((warning) => (
                  <li key={warning} className="flex items-start gap-1.5">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {parseResult && parseResult.questions.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="max-h-[46vh] overflow-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#f7f5fd] text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-faint">
                    <tr>
                      <th className="w-12 px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={allValidSelected}
                          onChange={toggleAll}
                          disabled={validQuestions.length === 0 || committing}
                          aria-label="Select all valid questions"
                          className="size-4 accent-[#D291BC]"
                        />
                      </th>
                      <th className="w-12 px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Question</th>
                      <th className="px-3 py-2.5">Answers</th>
                      <th className="w-16 px-3 py-2.5 text-center">Time</th>
                      <th className="w-32 px-3 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.questions.map((question) => {
                      const valid = question.errors.length === 0;
                      const checked = included.has(question.rowNumber);
                      return (
                        <tr
                          key={question.rowNumber}
                          className={cn(
                            "border-t border-line/80",
                            !valid && "bg-coral-soft/25",
                            valid && checked && "bg-mint-soft/15",
                          )}
                        >
                          <td className="px-3 py-3 align-top">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleRow(question.rowNumber)}
                              disabled={!valid || committing}
                              aria-label={`Include question from row ${question.rowNumber}`}
                              className="size-4 accent-[#D291BC]"
                            />
                          </td>
                          <td className="px-3 py-3 align-top text-xs font-bold text-ink-faint">
                            {question.questionNumber ?? question.rowNumber}
                          </td>
                          <td className="min-w-[240px] px-3 py-3 align-top">
                            <p className="text-sm font-semibold leading-snug">
                              {question.text || "—"}
                            </p>
                            {question.warnings.length > 0 ? (
                              <ul className="mt-1.5 space-y-0.5">
                                {question.warnings.map((warning) => (
                                  <li
                                    key={warning}
                                    className="flex items-start gap-1 text-[11px] text-[#a66f00]"
                                  >
                                    <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                                    {warning}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            {question.errors.length > 0 ? (
                              <ul className="mt-1.5 space-y-0.5">
                                {question.errors.map((error) => (
                                  <li
                                    key={error}
                                    className="flex items-start gap-1 text-[11px] font-semibold text-coral"
                                  >
                                    <AlertCircle className="mt-0.5 size-3 shrink-0" />
                                    {error}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </td>
                          <td className="px-3 py-3 align-top">
                            <div className="flex max-w-[260px] flex-wrap gap-1">
                              {question.answers.map((answer, index) => {
                                const isCorrect =
                                  question.correctIndices.includes(index);
                                return (
                                  <span
                                    key={`${answer}-${index}`}
                                    className={cn(
                                      "inline-flex max-w-full items-center gap-1 rounded-lg border px-2 py-1 text-[11px] leading-tight",
                                      isCorrect
                                        ? "border-mint/25 bg-mint-soft font-bold text-mint"
                                        : "border-line bg-white text-ink-soft",
                                    )}
                                    title={answer}
                                  >
                                    <span className="font-extrabold">
                                      {LETTERS[index]}
                                    </span>
                                    <span className="truncate">{answer}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center align-top">
                            <span className="text-xs font-semibold text-ink-soft">
                              {question.timeLimit}s
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right align-top">
                            {valid ? (
                              <Badge tone="mint">
                                <Check className="size-3" />
                                Ready
                              </Badge>
                            ) : (
                              <Badge tone="coral">
                                <X className="size-3" />
                                {question.errors.length} issue
                                {question.errors.length === 1 ? "" : "s"}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {conflict ? (
            <div className="rounded-2xl border border-[#f0c36b] bg-sun-soft p-4">
              <p className="flex items-center gap-2 text-sm font-extrabold text-[#7a5300]">
                <TriangleAlert className="size-4" />
                A subject named “{subjectName.trim()}” already exists
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#7a5300]">
                It currently has {conflict.existingQuestionCount} question
                {conflict.existingQuestionCount === 1 ? "" : "s"}. Choose what
                should happen to the existing subject.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void submitImport("append")}
                  disabled={committing}
                >
                  Append questions
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void submitImport("replace")}
                  disabled={committing}
                >
                  Replace all questions
                </Button>
                <Button
                  size="sm"
                  onClick={() => void submitImport("new")}
                  disabled={committing}
                >
                  Create a copy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConflict(null)}
                  disabled={committing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={resetFile}
              disabled={committing}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <span className="text-xs font-semibold text-ink-faint sm:mr-2">
                {selectedQuestions.length} selected
              </span>
              {conflict ? null : (
                <Button
                  type="button"
                  onClick={() => void submitImport()}
                  disabled={
                    committing ||
                    selectedQuestions.length === 0 ||
                    Boolean(parseResult?.fileErrors.length)
                  }
                >
                  {committing ? <Spinner /> : <CheckCircle2 className="size-4" />}
                  Import {selectedQuestions.length || ""} question
                  {selectedQuestions.length === 1 ? "" : "s"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
