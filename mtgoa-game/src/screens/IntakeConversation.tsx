/**
 * IntakeConversation — Applied Mode's Six Unpacking Questions, played as a
 * scripted, no-AI conversation. Walks engine/intake/intakeMachine's steps,
 * collects answers, and hands the finalized IntakeConfig (plus who it's about)
 * to the caller, which synthesizes a trust encounter via buildEncounterFromIntake.
 *
 * No model is required: this is the dual-track floor. (An LLM enhancer can later
 * reflect answers back more warmly via api/intake.ts, but it is optional polish.)
 */
import { useMemo, useState } from "react";

import { CHANNELS } from "@/data/channels";
import { channelClass } from "../../design-system/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IntakeConfig } from "@/api/intake";
import {
  INTAKE_STEPS,
  FEELINGS,
  TARGET_CHANNELS,
  emptyAnswers,
  canFinalize,
  feelingsToChannels,
  finalizeIntake,
  type IntakeAnswers,
} from "@/engine/intake/intakeMachine";
import { MAX_DISTINCT_NEEDS } from "@/engine/intake/buildEncounter";

interface Props {
  onComplete: (config: IntakeConfig, npcName: string) => void;
  onExit: () => void;
}

export function IntakeConversation({ onComplete, onExit }: Props) {
  const [answers, setAnswers] = useState<IntakeAnswers>(emptyAnswers);
  const [npcName, setNpcName] = useState("");
  const [stepIndex, setStepIndex] = useState(0);

  const step = INTAKE_STEPS[stepIndex];
  const isLast = stepIndex === INTAKE_STEPS.length - 1;

  const distinctSelected = useMemo(
    () => new Set(feelingsToChannels(answers.feelings)).size,
    [answers.feelings],
  );

  // Per-step gate: Q1 needs an experience, Q4 needs a feeling; the rest are free.
  const canAdvance =
    step.field === "experience"
      ? answers.experience.trim().length > 0
      : step.field === "feelings"
        ? answers.feelings.length > 0
        : true;

  const setText = (field: keyof IntakeAnswers, value: string) =>
    setAnswers((a) => ({ ...a, [field]: value }));

  const toggleFeeling = (id: string) =>
    setAnswers((a) => {
      const has = a.feelings.includes(id);
      if (has) return { ...a, feelings: a.feelings.filter((f) => f !== id) };
      // Soft cap: don't let the selection exceed MAX_DISTINCT_NEEDS channels.
      const prospective = new Set(feelingsToChannels([...a.feelings, id])).size;
      if (prospective > MAX_DISTINCT_NEEDS) return a;
      return { ...a, feelings: [...a.feelings, id] };
    });

  const finish = () => onComplete(finalizeIntake(answers), npcName);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-text">Applied Mode · Intake</h1>
          <p className="text-dim">
            Six questions. Your answers build the encounter around your real situation.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>Exit</Button>
      </header>

      {/* Progress rail */}
      <ol className="flex flex-wrap gap-1.5">
        {INTAKE_STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              onClick={() => setStepIndex(i)}
              className={cn(
                "h-2 w-10 rounded-full transition-colors",
                i < stepIndex ? "bg-accent" : i === stepIndex ? "bg-accent/60" : "bg-border",
              )}
              aria-label={`Question ${s.id}`}
            />
          </li>
        ))}
      </ol>

      {/* Optional: who is this about? (carried into the encounter framing) */}
      {stepIndex === 0 && (
        <label className="flex flex-col gap-1.5">
          <span className="ds-label text-muted">Who is this about? (optional)</span>
          <input
            value={npcName}
            onChange={(e) => setNpcName(e.target.value)}
            placeholder="A name, a role, or leave blank"
            className="rounded-card border border-border bg-card px-3 py-2 text-text placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>
      )}

      {/* Current question */}
      <section className="flex flex-col gap-3 rounded-card border border-border bg-surf p-5">
        <div className="flex items-center gap-2">
          <Badge className="bg-surf text-accent">Q{step.id}</Badge>
          <h2 className="text-lg font-bold text-text">{step.prompt}</h2>
        </div>
        <p className="text-card-body text-dim">{step.helper}</p>

        {step.kind === "text" && (
          <textarea
            value={String(answers[step.field] ?? "")}
            onChange={(e) => setText(step.field, e.target.value)}
            placeholder={step.placeholder}
            rows={3}
            className="resize-y rounded-card border border-border bg-card px-3 py-2 text-text placeholder:text-muted focus:border-accent focus:outline-none"
          />
        )}

        {step.kind === "channel" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {TARGET_CHANNELS.map(({ channel, label }) => {
              const selected = answers.targetChannel === channel;
              return (
                <button
                  key={channel}
                  onClick={() => setAnswers((a) => ({ ...a, targetChannel: channel }))}
                  className={cn(
                    "flex items-center gap-3 rounded-card border bg-card p-3 text-left transition-colors hover:bg-card/70",
                    selected ? channelClass[channel].border : "border-border",
                    selected && "ring-1 ring-accent",
                  )}
                >
                  <span className={cn("text-2xl", channelClass[channel].text)}>{CHANNELS[channel].glyph}</span>
                  <span className="flex flex-col">
                    <span className="text-card-title font-bold text-text">{channel}</span>
                    <span className="text-[11px] text-muted">{label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {step.kind === "feelings" && (
          <div className="flex flex-col gap-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {FEELINGS.map((f) => {
                const selected = answers.feelings.includes(f.id);
                const wouldExceed =
                  !selected &&
                  new Set(feelingsToChannels([...answers.feelings, f.id])).size > MAX_DISTINCT_NEEDS;
                return (
                  <button
                    key={f.id}
                    disabled={wouldExceed}
                    onClick={() => toggleFeeling(f.id)}
                    className={cn(
                      "flex flex-col gap-1 rounded-card border bg-card p-3 text-left transition-colors hover:bg-card/70 disabled:opacity-40",
                      selected ? "border-accent ring-1 ring-accent" : "border-border",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-card-title font-bold text-text">{f.label}</span>
                      <span className="flex gap-1">
                        {f.channels.map((ch) => (
                          <span key={ch} className={cn("text-sm", channelClass[ch].text)}>
                            {CHANNELS[ch].glyph}
                          </span>
                        ))}
                      </span>
                    </span>
                    <span className="text-[11px] text-muted">{f.blurb}</span>
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-muted">
              {distinctSelected}/{MAX_DISTINCT_NEEDS} channels selected — these become what you read and meet.
            </span>
          </div>
        )}
      </section>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </Button>
        {!isLast ? (
          <Button disabled={!canAdvance} onClick={() => setStepIndex((i) => i + 1)}>
            Next
          </Button>
        ) : (
          <Button disabled={!canFinalize(answers)} onClick={finish}>
            Build my encounter
          </Button>
        )}
      </div>
    </div>
  );
}
