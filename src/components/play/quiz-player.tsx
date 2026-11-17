"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  ListChecks,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  TimerOff,
  Trophy,
  X,
  XCircle,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatMinutes } from "@/lib/utils";

export type PlayQuestion = {
  id: string;
  text: string;
  timeLimit: number;
  answers: { id: string; text: string; isCorrect: boolean }[];
};

type Stage = "setup" | "playing" | "summary";
type Phase = "answering" | "correct" | "wrong" | "timeout";
type Outcome = "correct" | "wrong" | "timeout";

const LETTERS = ["A", "B", "C", "D"];
const AUTO_ADVANCE_MS = 750;

function shuffleArray<T>(input: readonly T[]): T[] {
  const items = [...input];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        checked
          ? "border-brand/30 bg-brand-soft/45"
          : "border-line bg-white hover:border-line-strong",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl transition",
          checked ? "bg-brand text-white" : "bg-[#f3f1f9] text-ink-faint",
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
          {description}
        </span>
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-line-strong",
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}

const answerClasses: Record<string, string> = {
  idle: "border-line bg-white hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_12px_30px_-24px_rgba(29,26,51,0.5)]",
  selected: "border-brand bg-brand-soft/70 ring-2 ring-brand/20",
  correct: "border-mint/40 bg-mint-soft",
  wrong: "border-coral/40 bg-coral-soft",
  muted: "border-line bg-white/60 opacity-55",
};

const chipClasses: Record<string, string> = {
  idle: "bg-[#f3f1f9] text-ink-soft",
  selected: "bg-brand text-white",
  correct: "bg-mint text-white",
  wrong: "bg-coral text-white",
  muted: "bg-[#f3f1f9] text-ink-faint",
};

export function QuizPlayer({
  library,
  subject,
  questions,
}: {
  library: { id: string; name: string };
  subject: { id: string; name: string };
  questions: PlayQuestion[];
}) {
  const subjectHref = `/libraries/${library.id}/subjects/${subject.id}`;

  const [stage, setStage] = useState<Stage>("setup");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(true);

  const [deck, setDeck] = useState<PlayQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("answering");
  const [selected, setSelected] = useState<number[]>([]);
  const [outcomes, setOutcomes] = useState<(Outcome | undefined)[]>([]);
  const [remainingMs, setRemainingMs] = useState(0);

  const totalSeconds = questions.reduce(
    (total, question) => total + question.timeLimit,
    0,
  );
  const multiAnswerCount = questions.filter(
    (question) =>
      question.answers.filter((answer) => answer.isCorrect).length > 1,
  ).length;

  const question = deck[index];
  const revealed = phase !== "answering";
  const correctCount = outcomes.filter(
    (outcome) => outcome === "correct",
  ).length;
  const wrongCount = outcomes.filter((outcome) => outcome === "wrong").length;
  const timeoutCount = outcomes.filter(
    (outcome) => outcome === "timeout",
  ).length;
  const answeredCount = outcomes.filter(
    (outcome) => outcome !== undefined,
  ).length;

  function startSession() {
    let nextDeck: PlayQuestion[] = questions.map((item) => ({
      ...item,
      answers: [...item.answers],
    }));

    if (shuffleQuestions) nextDeck = shuffleArray(nextDeck);
    if (shuffleAnswers) {
      nextDeck = nextDeck.map((item) => ({
        ...item,
        answers: shuffleArray(item.answers),
      }));
    }

    setDeck(nextDeck);
    setIndex(0);
    setPhase("answering");
    setSelected([]);
    setOutcomes([]);
    setRemainingMs((nextDeck[0]?.timeLimit ?? 0) * 1000);
    setStage("playing");
  }

  function advance() {
    if (index + 1 >= deck.length) {
      setStage("summary");
      return;
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);
    setSelected([]);
    setPhase("answering");
    setRemainingMs(deck[nextIndex].timeLimit * 1000);
  }

  function submitAnswer(indices: number[]) {
    if (!question || phase !== "answering") return;

    const correctIndices = question.answers
      .map((answer, answerIndex) => (answer.isCorrect ? answerIndex : -1))
      .filter((answerIndex) => answerIndex >= 0);

    const isCorrect =
      indices.length === correctIndices.length &&
      indices.every((answerIndex) => correctIndices.includes(answerIndex));

    setSelected(indices);
    setOutcomes((previous) => {
      const next = [...previous];
      next[index] = isCorrect ? "correct" : "wrong";
      return next;
    });
    setPhase(isCorrect ? "correct" : "wrong");
  }

  function handleAnswerClick(position: number) {
    if (!question || phase !== "answering") return;

    const multipleCorrect =
      question.answers.filter((answer) => answer.isCorrect).length > 1;

    if (multipleCorrect) {
      setSelected((previous) =>
        previous.includes(position)
          ? previous.filter((answerIndex) => answerIndex !== position)
          : [...previous, position],
      );
      return;
    }

    submitAnswer([position]);
  }

  useEffect(() => {
    if (stage !== "playing" || phase !== "answering" || !timerEnabled) return;

    const activeQuestion = deck[index];
    if (!activeQuestion) return;

    const totalMs = activeQuestion.timeLimit * 1000;
    if (totalMs <= 0) return;

    const deadline = performance.now() + totalMs;
    const interval = window.setInterval(() => {
      const left = deadline - performance.now();
      if (left <= 0) {
        window.clearInterval(interval);
        setRemainingMs(0);
        setPhase("timeout");
        setOutcomes((previous) => {
          const next = [...previous];
          next[index] = "timeout";
          return next;
        });
      } else {
        setRemainingMs(left);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [stage, phase, index, timerEnabled, deck]);

  useEffect(() => {
    if (stage !== "playing" || phase !== "correct") return;

    const timeout = window.setTimeout(() => {
      if (index + 1 >= deck.length) {
        setStage("summary");
        return;
      }

      const nextIndex = index + 1;
      setIndex(nextIndex);
      setSelected([]);
      setPhase("answering");
      setRemainingMs(deck[nextIndex].timeLimit * 1000);
    }, AUTO_ADVANCE_MS);

    return () => window.clearTimeout(timeout);
  }, [stage, phase, index, deck]);

  if (questions.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-4 text-center">
        <span className="grid size-16 place-items-center rounded-3xl bg-brand-soft text-brand">
          <ListChecks className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
          Nothing to practise yet
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          This subject has no questions. Add a few, then come back for a round.
        </p>
        <Link href={subjectHref} className="mt-5">
          <Button size="lg">
            <ArrowLeft className="size-4" />
            Back to subject
          </Button>
        </Link>
      </div>
    );
  }

  if (stage === "setup") {
    return (
      <div className="min-h-screen">
        <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <Logo />
          <Link
            href={subjectHref}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-ink-soft transition hover:bg-white hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            Back to subject
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-16 pt-4 sm:pt-10">
          <span className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-[#e8b5d0] to-brand-strong text-white shadow-[0_18px_35px_-16px_rgba(210,145,188,0.8)]">
            <Play className="size-7 fill-current" />
          </span>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-brand">
            Practice session
          </p>
          <h1 className="mt-1.5 text-center text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
            {subject.name}
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">{library.name}</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge tone="brand">
              <ListChecks className="size-3" />
              {questions.length} question{questions.length === 1 ? "" : "s"}
            </Badge>
            <Badge tone="sun">
              <Clock3 className="size-3" />
              {formatMinutes(totalSeconds)} total
            </Badge>
            {multiAnswerCount > 0 ? (
              <Badge tone="mint">
                <Sparkles className="size-3" />
                {multiAnswerCount} multi-answer
              </Badge>
            ) : null}
          </div>

          <div className="mt-8 w-full rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_24px_70px_-40px_rgba(29,26,51,0.45)] sm:p-6">
            <h2 className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink-faint">
              Session options
            </h2>
            <div className="mt-3 space-y-2.5">
              <Toggle
                checked={shuffleQuestions}
                onChange={setShuffleQuestions}
                label="Shuffle questions"
                description="Randomise the order for this round."
                icon={Shuffle}
              />
              <Toggle
                checked={shuffleAnswers}
                onChange={setShuffleAnswers}
                label="Shuffle answers"
                description="Randomise A–D so you can't memorise positions."
                icon={Sparkles}
              />
              <Toggle
                checked={timerEnabled}
                onChange={setTimerEnabled}
                label="Countdown timer"
                description="Use each question's time limit. Turn off for untimed practice."
                icon={Clock3}
              />
            </div>

            <Button size="lg" className="mt-5 w-full" onClick={startSession}>
              <Play className="size-4 fill-current" />
              Start practice
            </Button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-faint">
              Picking an answer submits it right away. Correct answers advance
              automatically; wrong or timed-out answers wait for you.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (stage === "summary") {
    const accuracy =
      deck.length > 0 ? Math.round((correctCount / deck.length) * 100) : 0;
    const missed = deck
      .map((item, itemIndex) => ({
        question: item,
        outcome: outcomes[itemIndex],
      }))
      .filter(
        (entry) => entry.outcome === "wrong" || entry.outcome === "timeout",
      );

    return (
      <div className="min-h-screen">
        <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <Logo />
          <Link
            href={subjectHref}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-ink-soft transition hover:bg-white hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            Back to subject
          </Link>
        </header>

        <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-2 sm:pt-6">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-[#f6b73c] to-[#f08c00] text-white shadow-[0_18px_35px_-16px_rgba(240,140,0,0.75)]">
              <Trophy className="size-7" />
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              Session complete
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft">{subject.name}</p>
          </div>

          <div className="mt-7 flex flex-col items-center gap-6 rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_24px_70px_-40px_rgba(29,26,51,0.45)] sm:flex-row sm:gap-8">
            <div
              className="relative grid size-36 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#11a683 ${accuracy}%, #ece8f6 0)`,
              }}
            >
              <div className="grid size-[7.25rem] place-items-center rounded-full bg-white">
                <span className="text-3xl font-extrabold tracking-tight">
                  {accuracy}%
                </span>
                <span className="-mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                  accuracy
                </span>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2.5">
              {[
                {
                  label: "Correct",
                  value: correctCount,
                  tone: "bg-mint-soft text-mint",
                },
                {
                  label: "Wrong",
                  value: wrongCount,
                  tone: "bg-coral-soft text-coral",
                },
                {
                  label: "Timed out",
                  value: timeoutCount,
                  tone: "bg-sun-soft text-[#a66f00]",
                },
                {
                  label: "Questions",
                  value: deck.length,
                  tone: "bg-brand-soft text-brand-strong",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={cn("rounded-2xl px-4 py-3", stat.tone)}
                >
                  <p className="text-2xl font-extrabold leading-none">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] opacity-80">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="flex-1" onClick={startSession}>
              <RotateCcw className="size-4" />
              Practise again
            </Button>
            <Link href={subjectHref} className="flex-1">
              <Button size="lg" variant="secondary" className="w-full">
                <ArrowLeft className="size-4" />
                Back to subject
              </Button>
            </Link>
          </div>

          {answeredCount < deck.length ? (
            <p className="mt-3 text-center text-[11px] font-semibold text-ink-faint">
              {deck.length - answeredCount} question
              {deck.length - answeredCount === 1 ? "" : "s"} skipped
            </p>
          ) : null}

          {missed.length > 0 ? (
            <section className="mt-9">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold tracking-tight">
                  Review missed
                </h2>
                <span className="text-xs font-semibold text-ink-faint">
                  {missed.length} question{missed.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                {missed.map(({ question: missedQuestion, outcome }) => {
                  const correctAnswers = missedQuestion.answers
                    .map((answer, answerIndex) => ({
                      ...answer,
                      letter: LETTERS[answerIndex],
                    }))
                    .filter((answer) => answer.isCorrect);

                  return (
                    <li
                      key={missedQuestion.id}
                      className="rounded-2xl border border-line bg-white/85 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold leading-snug">
                          {missedQuestion.text}
                        </p>
                        <Badge
                          tone={outcome === "timeout" ? "sun" : "coral"}
                          className="shrink-0"
                        >
                          {outcome === "timeout" ? "Timed out" : "Missed"}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-faint">
                          Correct
                        </span>
                        {correctAnswers.map((answer) => (
                          <span
                            key={answer.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-mint-soft px-2 py-1 text-[11px] font-bold text-mint"
                          >
                            {answer.letter}. {answer.text}
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : (
            <div className="mt-8 rounded-2xl border border-mint/20 bg-mint-soft p-4 text-center text-sm font-bold text-mint">
              Perfect round — every answer was correct.
            </div>
          )}
        </main>
      </div>
    );
  }

  if (!question) return null;

  const multipleCorrect =
    question.answers.filter((answer) => answer.isCorrect).length > 1;
  const isLast = index + 1 >= deck.length;
  const totalMs = question.timeLimit * 1000;
  const timerRatio =
    totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const secondsLeft = Math.ceil(remainingMs / 1000);
  const timerBarColor =
    timerRatio <= 0.25
      ? "bg-coral"
      : timerRatio <= 0.5
        ? "bg-sun"
        : "bg-brand";
  const timerTextColor =
    timerRatio <= 0.25
      ? "text-coral"
      : timerRatio <= 0.5
        ? "text-[#a66f00]"
        : "text-ink-soft";
  const progress =
    deck.length > 0 ? ((index + (revealed ? 1 : 0)) / deck.length) * 100 : 0;
  const correctText = question.answers
    .map((answer, answerIndex) =>
      answer.isCorrect ? `${LETTERS[answerIndex]}. ${answer.text}` : null,
    )
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/80 bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:py-4">
          <Link
            href={subjectHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-ink-soft transition hover:bg-white hover:text-ink"
            title="Exit practice"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3 text-[11px] font-bold">
              <span className="truncate text-ink-soft">{subject.name}</span>
              <span className="shrink-0 tabular-nums text-ink-faint">
                {index + 1} / {deck.length}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white ring-1 ring-line/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#e8b5d0] to-brand transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-mint-soft px-2.5 py-1.5 text-xs font-extrabold tabular-nums text-mint"
            title={`${correctCount} correct`}
          >
            <Check className="size-3.5" strokeWidth={3} />
            {correctCount}
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-3xl flex-col justify-center px-4 py-8">
        <div key={question.id} className="animate-fade-up">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">Question {index + 1}</Badge>
            {multipleCorrect ? (
              <Badge tone="sun">
                <Sparkles className="size-3" />
                Select all correct answers
              </Badge>
            ) : null}
          </div>

          <div className="mt-4 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_24px_70px_-40px_rgba(29,26,51,0.45)] sm:p-7">
            <h1 className="text-xl font-extrabold leading-snug tracking-[-0.02em] sm:text-2xl">
              {question.text}
            </h1>

            {timerEnabled ? (
              <div className="mt-5 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f1eff8]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-100 ease-linear",
                      timerBarColor,
                    )}
                    style={{ width: `${timerRatio * 100}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "w-12 text-right text-sm font-extrabold tabular-nums",
                    timerTextColor,
                  )}
                  aria-live="off"
                >
                  {secondsLeft}s
                </span>
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-1.5 text-[11px] font-bold text-ink-faint">
                <TimerOff className="size-3.5" />
                Untimed practice
              </div>
            )}

            <div
              className={cn(
                "mt-5 grid gap-3",
                question.answers.length > 2 && "sm:grid-cols-2",
              )}
            >
              {question.answers.map((answer, position) => {
                const isSelected = selected.includes(position);
                const state = revealed
                  ? answer.isCorrect
                    ? "correct"
                    : isSelected
                      ? "wrong"
                      : "muted"
                  : isSelected
                    ? "selected"
                    : "idle";

                return (
                  <button
                    key={answer.id}
                    type="button"
                    onClick={() => handleAnswerClick(position)}
                    disabled={revealed}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-default",
                      answerClasses[state],
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold transition",
                        chipClasses[state],
                      )}
                    >
                      {LETTERS[position]}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">
                      {answer.text}
                    </span>
                    {state === "correct" ? (
                      <Check
                        className="size-5 shrink-0 text-mint"
                        strokeWidth={2.5}
                      />
                    ) : state === "wrong" ? (
                      <X
                        className="size-5 shrink-0 text-coral"
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {!revealed && multipleCorrect ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-ink-faint">
                  {selected.length} selected — pick every correct answer.
                </p>
                <Button
                  size="lg"
                  onClick={() => submitAnswer(selected)}
                  disabled={selected.length === 0}
                >
                  <CheckCircle2 className="size-4" />
                  Check answer
                </Button>
              </div>
            ) : null}

            {!revealed && !multipleCorrect ? (
              <p className="mt-5 text-center text-[11px] font-semibold text-ink-faint">
                Choose one answer to submit.
              </p>
            ) : null}

            {phase === "correct" ? (
              <div
                role="status"
                aria-live="polite"
                className="animate-pop-in mt-5 flex items-center gap-3 rounded-2xl border border-mint/20 bg-mint-soft px-4 py-3.5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-mint">
                  <CheckCircle2 className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-mint">Correct!</p>
                  <p className="text-[11px] font-semibold text-mint/80">
                    Next question coming up…
                  </p>
                </div>
              </div>
            ) : null}

            {phase === "wrong" || phase === "timeout" ? (
              <div
                role="alert"
                className={cn(
                  "animate-pop-in mt-5 rounded-2xl border px-4 py-3.5",
                  phase === "timeout"
                    ? "border-sun/25 bg-sun-soft"
                    : "border-coral/25 bg-coral-soft",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl bg-white",
                      phase === "timeout" ? "text-[#a66f00]" : "text-coral",
                    )}
                  >
                    {phase === "timeout" ? (
                      <TimerOff className="size-4.5" />
                    ) : (
                      <XCircle className="size-4.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-extrabold",
                        phase === "timeout" ? "text-[#7a5300]" : "text-coral",
                      )}
                    >
                      {phase === "timeout" ? "Time's up" : "Not quite"}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                      The correct{" "}
                      {question.answers.filter((answer) => answer.isCorrect)
                        .length === 1
                        ? "answer is"
                        : "answers are"}{" "}
                      highlighted above.
                    </p>
                    <p className="mt-1.5 text-[11px] font-bold leading-relaxed text-mint">
                      Correct: {correctText}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button onClick={advance}>
                    {isLast ? "See results" : "Continue"}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
