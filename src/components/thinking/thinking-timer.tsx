"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { saveThinkingSession } from "@/app/problems/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_THINKING_MINUTES,
  MAX_THINKING_MINUTES,
  MAX_THOUGHTS_LENGTH,
  MIN_THINKING_MINUTES,
  MIN_THINKING_SECONDS,
  THINKING_DRAFT_PREFIX,
  THINKING_DURATION_PRESETS,
} from "@/lib/constants";
import { cn, formatClock } from "@/lib/utils";
import type { ThinkingSessionFormState } from "@/types";

const INITIAL_STATE: ThinkingSessionFormState = { status: "idle" };

const THOUGHTS_PLACEHOLDER =
  "# Maybe sort the array?\n# But sorting loses the original indices.";

/** `setup` -> `running` <-> `paused` -> `timeup` -> (save | discard). */
type Phase = "setup" | "running" | "paused" | "timeup";

/**
 * "▶ Start Thinking" and the timer it opens.
 *
 * The countdown is derived from a wall-clock `endTime` on every tick instead of
 * decrementing a counter, so a throttled tab or a slow frame can never make the
 * session drift short. Thoughts are written to `localStorage` on every
 * keystroke while the dialog is open and only removed once the server action
 * confirms the session was stored.
 */
export function ThinkingTimer({
  problemId,
  defaultMinutes = DEFAULT_THINKING_MINUTES,
}: {
  problemId: string;
  defaultMinutes?: number;
}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [minutes, setMinutes] = useState(defaultMinutes);
  const [customMinutes, setCustomMinutes] = useState("");
  const [totalSeconds, setTotalSeconds] = useState(defaultMinutes * 60);
  const [remaining, setRemaining] = useState(defaultMinutes * 60);
  const [elapsed, setElapsed] = useState(0);
  const [thoughts, setThoughts] = useState("");
  const [confirming, setConfirming] = useState<null | "discard" | "too-short">(null);
  const [pendingElapsed, setPendingElapsed] = useState(0);

  const [state, formAction, pending] = useActionState(
    saveThinkingSession,
    INITIAL_STATE
  );

  // Wall clock in refs: the interval must never read (or close over) state.
  const totalRef = useRef(defaultMinutes * 60);
  const endTimeRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);

  const durationInputRef = useRef<HTMLInputElement>(null);
  const startedAtInputRef = useRef<HTMLInputElement>(null);
  const endedAtInputRef = useRef<HTMLInputElement>(null);
  const thoughtsRef = useRef<HTMLTextAreaElement>(null);
  const handledRef = useRef<ThinkingSessionFormState | null>(null);

  const draftKey = `${THINKING_DRAFT_PREFIX}${problemId}`;

  /** Seconds actually spent thinking, paused time excluded, capped at the total. */
  const elapsedAt = useCallback((now: number) => {
    const running =
      segmentStartRef.current === null ? 0 : now - segmentStartRef.current;
    const elapsedMs = Math.min(
      totalRef.current * 1000,
      accumulatedRef.current + running
    );
    return Math.max(0, Math.floor(elapsedMs / 1000));
  }, []);

  /** Keep the hidden payload fresh so a submit carries the real duration. */
  const syncPayload = useCallback(() => {
    if (durationInputRef.current) {
      durationInputRef.current.value = String(elapsedAt(Date.now()));
    }
    if (endedAtInputRef.current) {
      endedAtInputRef.current.value = new Date().toISOString();
    }
  }, [elapsedAt]);

  // Countdown tick. Only the `running` phase schedules an interval, and the
  // remaining time is recomputed from `endTime`, so ticks cannot drift.
  useEffect(() => {
    if (phase !== "running") return;

    const tick = () => {
      const now = Date.now();
      const remainingMs = Math.max(0, endTimeRef.current - now);

      setRemaining(Math.ceil(remainingMs / 1000));
      setElapsed(elapsedAt(now));
      syncPayload();

      if (remainingMs === 0) {
        accumulatedRef.current = totalRef.current * 1000;
        segmentStartRef.current = null;
        setPhase("timeup");
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [phase, elapsedAt, syncPayload]);

  // Keep the localStorage draft in sync while the dialog is open.
  useEffect(() => {
    if (!open) return;
    window.localStorage.setItem(draftKey, thoughts);
  }, [draftKey, open, thoughts]);

  // Time's up: hand the keyboard to the notes instead of the timer.
  useEffect(() => {
    if (phase === "timeup") thoughtsRef.current?.focus();
  }, [phase]);

  const resetClock = useCallback(() => {
    totalRef.current = minutes * 60;
    endTimeRef.current = 0;
    segmentStartRef.current = null;
    accumulatedRef.current = 0;
    setTotalSeconds(minutes * 60);
    setRemaining(minutes * 60);
    setElapsed(0);
    setPhase("setup");
  }, [minutes]);

  // The session is stored — drop the draft, reset, and close.
  useEffect(() => {
    if (state.status !== "success" || state === handledRef.current) return;
    handledRef.current = state;

    window.localStorage.removeItem(draftKey);
    resetClock();
    setThoughts("");
    setConfirming(null);
    setOpen(false);
  }, [draftKey, resetClock, state]);

  function start() {
    const total =
      Math.min(Math.max(minutes, MIN_THINKING_MINUTES), MAX_THINKING_MINUTES) * 60;
    const now = Date.now();

    totalRef.current = total;
    accumulatedRef.current = 0;
    endTimeRef.current = now + total * 1000;
    setTotalSeconds(total);
    setElapsed(0);
    setRemaining(total);
    setPhase("running");

    if (durationInputRef.current) durationInputRef.current.value = "0";
    if (startedAtInputRef.current) {
      startedAtInputRef.current.value = new Date(now).toISOString();
    }
    if (endedAtInputRef.current) endedAtInputRef.current.value = "";
  }

  function pause() {
    if (phase !== "running") return;
    const now = Date.now();

    accumulatedRef.current = Math.min(
      totalRef.current * 1000,
      accumulatedRef.current + (now - (segmentStartRef.current ?? now))
    );
    segmentStartRef.current = null;
    setElapsed(elapsedAt(now));
    setPhase("paused");
    syncPayload();
  }

  function resume() {
    if (phase !== "paused") return;
    const now = Date.now();

    endTimeRef.current = now + remaining * 1000;
    segmentStartRef.current = now;
    setPhase("running");
  }

  /** Finish = save, except for a session too short to be worth a row. */
  function finish() {
    syncPayload();
    const spent = elapsedAt(Date.now());
    if (spent < MIN_THINKING_SECONDS) {
      setPendingElapsed(spent);
      setConfirming("too-short");
    }
  }

  function askDiscard() {
    setPendingElapsed(elapsedAt(Date.now()));
    setConfirming("discard");
  }

  function discard() {
    // The draft stays in localStorage: these thoughts were never stored anywhere.
    resetClock();
    setThoughts("");
    setConfirming(null);
    setOpen(false);
  }

  function close() {
    setOpen(false);
    setConfirming(null);
    if (phase === "setup") resetClock();
  }

  function setCustom(value: string) {
    setCustomMinutes(value);
    const parsed = Number(value);
    if (
      value.trim() &&
      Number.isInteger(parsed) &&
      parsed >= MIN_THINKING_MINUTES &&
      parsed <= MAX_THINKING_MINUTES
    ) {
      setMinutes(parsed);
    }
  }

  const customActive = !THINKING_DURATION_PRESETS.includes(
    minutes as (typeof THINKING_DURATION_PRESETS)[number]
  );
  const progress = totalSeconds
    ? Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100))
    : 0;

  return (
    <>
      <Button
        onClick={() => {
          // Prefill with the unfinished draft from a previous run, if any.
          const draft = window.localStorage.getItem(draftKey);
          if (draft) setThoughts(draft);
          setOpen(true);
        }}
      >
        <span aria-hidden>▶</span> Start Thinking
      </Button>

      <Modal
        open={open}
        onClose={() => {
          if (phase === "setup") close();
          else askDiscard();
        }}
        title="Thinking session"
        className="max-h-[85vh] max-w-xl overflow-y-auto"
      >
        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="problemId" value={problemId} />
          <input
            ref={durationInputRef}
            type="hidden"
            name="durationSeconds"
            defaultValue={0}
          />
          <input
            ref={endedAtInputRef}
            type="hidden"
            name="endedAt"
            defaultValue=""
          />
          <input
            ref={startedAtInputRef}
            type="hidden"
            name="startedAt"
            defaultValue=""
          />

          {phase === "setup" ? (
            <SetupStep
              minutes={minutes}
              customMinutes={customMinutes}
              customActive={customActive}
              onSelect={setMinutes}
              onCustom={setCustom}
              onStart={start}
            />
          ) : (
            <>
              <input type="hidden" name="thoughts" value={thoughts} />
              <RunningStep
                phase={phase}
                remaining={remaining}
                progress={progress}
                thoughts={thoughts}
                textareaRef={thoughtsRef}
                pending={pending}
                onThoughts={setThoughts}
                onPause={pause}
                onResume={resume}
                onFinish={finish}
                onCancel={askDiscard}
              />
            </>
          )}

          {state.status === "error" && state.message ? (
            <p role="alert" className="text-xs text-rose-400">
              {state.message}
            </p>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={
          confirming === "too-short" ? "Too short to save" : "Discard this session?"
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-muted">
            {confirming === "too-short" ? (
              <>
                You thought for {formatClock(pendingElapsed)} — under the{" "}
                {MIN_THINKING_SECONDS} seconds a session needs. Nothing was saved.
              </>
            ) : (
              <>
                You have thought for {formatClock(pendingElapsed)} and this session
                will not be saved.
              </>
            )}{" "}
            {thoughts.trim()
              ? "Your draft stays in this browser so you can pick it up again."
              : null}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirming(null)}>
              Keep thinking
            </Button>
            <Button variant="danger" onClick={discard}>
              Discard session
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Step 1 — pick how much protected time this session gets. */
function SetupStep({
  minutes,
  customMinutes,
  customActive,
  onSelect,
  onCustom,
  onStart,
}: {
  minutes: number;
  customMinutes: string;
  customActive: boolean;
  onSelect: (minutes: number) => void;
  onCustom: (value: string) => void;
  onStart: () => void;
}) {
  const customInputId = useId();

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-muted">
        The timer is not a productivity metric — it protects your thinking time.
        Write your ideas as they come; you save them when you finish.
      </p>

      <div
        role="group"
        aria-label="Session length"
        className="flex flex-wrap items-center gap-2"
      >
        {THINKING_DURATION_PRESETS.map((preset) => (
          <Pill
            key={preset}
            active={minutes === preset}
            onClick={() => onSelect(preset)}
          >
            {preset} min
          </Pill>
        ))}
        <Pill
          active={customActive}
          onClick={() => document.getElementById(customInputId)?.focus()}
        >
          Custom
        </Pill>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={customInputId} className="text-xs font-medium text-muted">
          Custom duration in minutes ({MIN_THINKING_MINUTES}–{MAX_THINKING_MINUTES})
        </label>
        <div className="flex items-center gap-2">
          <Input
            id={customInputId}
            type="number"
            inputMode="numeric"
            min={MIN_THINKING_MINUTES}
            max={MAX_THINKING_MINUTES}
            value={customMinutes}
            onChange={(event) => onCustom(event.target.value)}
            placeholder={String(DEFAULT_THINKING_MINUTES)}
            className="w-28"
          />
          <span className="text-sm text-muted">minutes</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button onClick={onStart}>
          <span aria-hidden>▶</span> Start {minutes} minutes
        </Button>
      </div>
    </div>
  );
}

/** Step 2 — the countdown, the notes, and the three controls. */
function RunningStep({
  phase,
  remaining,
  progress,
  thoughts,
  textareaRef,
  pending,
  onThoughts,
  onPause,
  onResume,
  onFinish,
  onCancel,
}: {
  phase: Exclude<Phase, "setup">;
  remaining: number;
  progress: number;
  thoughts: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  pending: boolean;
  onThoughts: (value: string) => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onCancel: () => void;
}) {
  const thoughtsId = useId();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs tracking-wide text-muted">
          <span aria-hidden>🧠</span> Think independently before asking AI
        </span>

        {/* The ticking number is deliberately not a live region — one announcement
            per second would drown out everything else. State changes announce
            through the polite region below. */}
        <div role="timer" aria-live="off" className="font-mono text-5xl text-ink tabular-nums">
          {formatClock(remaining)}
        </div>

        <div
          role="progressbar"
          aria-label="Session progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="h-1 w-full overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className="h-full rounded-full bg-accent/70 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p aria-live="polite" className="sr-only">
          {phase === "timeup"
            ? "Time is up. Write what you would like to remember, then save."
            : phase === "paused"
              ? `Paused at ${formatClock(remaining)}.`
              : ""}
        </p>
      </div>

      {phase === "timeup" ? (
        <p className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm leading-relaxed text-ink">
          <span aria-hidden>⏰</span> Time&apos;s up — write what you&apos;d like to
          remember, then save. Finishing early is fine too.
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={thoughtsId} className="text-xs font-medium text-muted">
          Your thoughts — ideas, hypotheses, questions, failed approaches
        </label>
        <Textarea
          ref={textareaRef}
          id={thoughtsId}
          rows={9}
          maxLength={MAX_THOUGHTS_LENGTH}
          value={thoughts}
          onChange={(event) => onThoughts(event.target.value)}
          placeholder={THOUGHTS_PLACEHOLDER}
          className="font-mono text-sm leading-relaxed"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          {phase === "running" ? (
            <Button variant="outline" size="sm" onClick={onPause} disabled={pending}>
              Pause
            </Button>
          ) : null}
          {phase === "paused" ? (
            <Button variant="outline" size="sm" onClick={onResume} disabled={pending}>
              Resume
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {pending ? <Spinner label="Saving…" /> : null}
          <Button size="sm" type="submit" onClick={onFinish} disabled={pending}>
            Finish thinking
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Duration pill, matching the picker styling used in the problem form. */
function Pill({
  active,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-accent/40 bg-accent/15 text-indigo-200"
          : "border-border bg-surface-2 text-muted hover:text-ink",
        className
      )}
      {...props}
    />
  );
}
