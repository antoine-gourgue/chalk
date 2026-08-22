"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteWorkout, saveWorkout } from "@/app/box/[slug]/actions";
import { Button, Card, FIELD } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  BLOCK_FORMATS,
  BLOCK_FORMAT_LABELS,
  BLOCK_KINDS,
  BLOCK_KIND_LABELS,
  TIMED_FORMATS,
  emptyBlock,
  emptyMovement,
  type BlockInput,
  type BlockMovementInput,
} from "@/lib/workout-schema";

type MovementOption = { id: string; name: string; modality: string };

const MODALITY_LABELS: Record<string, string> = {
  WEIGHTLIFTING: "Haltérophilie",
  GYMNASTICS: "Gymnastique",
  MONOSTRUCTURAL: "Cardio",
  ACCESSORY: "Accessoire",
};

const field = cn(FIELD, "px-3 py-2");

/** Chaque type de bloc porte sa couleur, du tableau de la semaine à l'éditeur. */
const KIND_ACCENT: Record<string, string> = {
  WARMUP: "before:bg-white/20",
  STRENGTH: "before:bg-brand",
  GYMNASTICS: "before:bg-data",
  METCON: "before:bg-urgent",
  ACCESSORY: "before:bg-white/25",
  COOLDOWN: "before:bg-white/15",
};

/** Convertit une saisie en nombre, en traitant le champ vide comme « non renseigné ». */
function toNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

export function WorkoutEditor({
  slug,
  date,
  dateLabel,
  movements,
  initial,
  exists,
}: {
  slug: string;
  date: string;
  dateLabel: string;
  movements: MovementOption[];
  initial: { title: string; coachNotes: string; published: boolean; blocks: BlockInput[] };
  exists: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initial.title);
  const [coachNotes, setCoachNotes] = useState(initial.coachNotes);
  const [published, setPublished] = useState(initial.published);
  const [blocks, setBlocks] = useState<BlockInput[]>(initial.blocks);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const byModality = movements.reduce<Record<string, MovementOption[]>>((groups, movement) => {
    (groups[movement.modality] ??= []).push(movement);
    return groups;
  }, {});

  function patchBlock(index: number, patch: Partial<BlockInput>) {
    setBlocks((current) =>
      current.map((block, position) => (position === index ? { ...block, ...patch } : block)),
    );
    setSaved(false);
  }

  function patchMovement(
    blockIndex: number,
    movementIndex: number,
    patch: Partial<BlockMovementInput>,
  ) {
    setBlocks((current) =>
      current.map((block, position) =>
        position === blockIndex
          ? {
              ...block,
              movements: block.movements.map((movement, index) =>
                index === movementIndex ? { ...movement, ...patch } : movement,
              ),
            }
          : block,
      ),
    );
    setSaved(false);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) {
      return;
    }
    setBlocks((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveWorkout({
        boxSlug: slug,
        date,
        title: title.trim(),
        coachNotes: coachNotes.trim() === "" ? null : coachNotes.trim(),
        published,
        blocks,
      });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-void/80 border-edge-soft sticky top-[57px] z-20 -mx-6 flex flex-wrap items-end justify-between gap-4 border-b px-6 py-4 backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <p className="text-chalk-faint font-mono text-[11px] tracking-[0.18em] uppercase">
            {dateLabel}
          </p>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setSaved(false);
            }}
            placeholder="Titre de la séance"
            aria-label="Titre de la séance"
            className="placeholder:text-chalk-faint focus-visible:ring-brand w-full max-w-xl rounded-lg bg-transparent text-3xl font-extrabold tracking-[-0.03em] focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="border-edge text-chalk-dim flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => {
                setPublished(event.target.checked);
                setSaved(false);
              }}
              className="accent-brand"
            />
            Visible par les membres
          </label>

          {exists ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await deleteWorkout(slug, date);
                  router.push(`/box/${slug}/semaine?du=${date}`);
                });
              }}
            >
              Supprimer
            </Button>
          ) : null}

          <Button type="button" disabled={pending} onClick={save}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="border-urgent/40 bg-urgent/10 text-urgent rounded-xl border px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="border-data/40 bg-data/10 text-data rounded-xl border px-4 py-3 text-sm">
          Séance enregistrée.
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        {blocks.map((block, blockIndex) => (
          <Card
            key={blockIndex}
            className={cn(
              "relative flex flex-col gap-4 overflow-hidden p-5 pl-6",
              "before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-['']",
              KIND_ACCENT[block.kind] ?? "before:bg-white/20",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={block.kind}
                onChange={(event) =>
                  patchBlock(blockIndex, { kind: event.target.value as BlockInput["kind"] })
                }
                aria-label="Type de bloc"
                className={cn(field, "font-semibold")}
              >
                {BLOCK_KINDS.map((kind) => (
                  <option key={kind} value={kind} className="bg-night">
                    {BLOCK_KIND_LABELS[kind]}
                  </option>
                ))}
              </select>

              <select
                value={block.format}
                onChange={(event) =>
                  patchBlock(blockIndex, { format: event.target.value as BlockInput["format"] })
                }
                aria-label="Format du bloc"
                className={field}
              >
                {BLOCK_FORMATS.map((format) => (
                  <option key={format} value={format} className="bg-night">
                    {BLOCK_FORMAT_LABELS[format]}
                  </option>
                ))}
              </select>

              <input
                value={block.title ?? ""}
                onChange={(event) =>
                  patchBlock(blockIndex, {
                    title: event.target.value === "" ? null : event.target.value,
                  })
                }
                placeholder="Nom du bloc (facultatif)"
                aria-label="Nom du bloc"
                className={cn(field, "min-w-40 flex-1")}
              />

              {TIMED_FORMATS.has(block.format) ? (
                <label className="text-chalk-faint flex items-center gap-2 text-xs">
                  Durée
                  <input
                    type="number"
                    min={0}
                    value={block.durationSeconds === null ? "" : block.durationSeconds / 60}
                    onChange={(event) => {
                      const minutes = toNumber(event.target.value);
                      patchBlock(blockIndex, {
                        durationSeconds: minutes === null ? null : Math.round(minutes * 60),
                      });
                    }}
                    className={cn(field, "w-20 font-mono tabular-nums")}
                  />
                  min
                </label>
              ) : null}

              {block.format === "EMOM" || block.format === "INTERVALS" ? (
                <label className="text-chalk-faint flex items-center gap-2 text-xs">
                  Tours
                  <input
                    type="number"
                    min={0}
                    value={block.rounds ?? ""}
                    onChange={(event) =>
                      patchBlock(blockIndex, { rounds: toNumber(event.target.value) })
                    }
                    className={cn(field, "w-20 font-mono tabular-nums")}
                  />
                </label>
              ) : null}

              <div className="ml-auto flex items-center gap-1">
                <IconButton label="Monter le bloc" onClick={() => moveBlock(blockIndex, -1)}>
                  ↑
                </IconButton>
                <IconButton label="Descendre le bloc" onClick={() => moveBlock(blockIndex, 1)}>
                  ↓
                </IconButton>
                <IconButton
                  label="Supprimer le bloc"
                  danger
                  onClick={() => {
                    setBlocks((current) => current.filter((_, index) => index !== blockIndex));
                    setSaved(false);
                  }}
                >
                  ✕
                </IconButton>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {block.movements.map((movement, movementIndex) => (
                <div
                  key={movementIndex}
                  className="border-edge-soft flex flex-wrap items-center gap-2 rounded-xl border bg-white/3 p-2.5"
                >
                  <input
                    type="number"
                    min={0}
                    value={movement.reps ?? ""}
                    onChange={(event) =>
                      patchMovement(blockIndex, movementIndex, {
                        reps: toNumber(event.target.value),
                      })
                    }
                    placeholder="Reps"
                    aria-label="Répétitions"
                    className={cn(field, "text-data w-20 font-mono font-semibold tabular-nums")}
                  />

                  <select
                    value={movement.movementId}
                    onChange={(event) =>
                      patchMovement(blockIndex, movementIndex, { movementId: event.target.value })
                    }
                    aria-label="Mouvement"
                    className={cn(field, "min-w-44 flex-1 font-medium")}
                  >
                    <option value="" className="bg-night">
                      Choisir un mouvement…
                    </option>
                    {Object.entries(byModality).map(([modality, options]) => (
                      <optgroup key={modality} label={MODALITY_LABELS[modality] ?? modality}>
                        {options.map((option) => (
                          <option key={option.id} value={option.id} className="bg-night">
                            {option.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  <label className="text-chalk-faint flex items-center gap-1.5 text-xs">
                    H
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={movement.loadMale ?? ""}
                      onChange={(event) =>
                        patchMovement(blockIndex, movementIndex, {
                          loadMale: toNumber(event.target.value),
                        })
                      }
                      aria-label="Charge hommes en kilogrammes"
                      className={cn(field, "w-20 font-mono tabular-nums")}
                    />
                  </label>
                  <label className="text-chalk-faint flex items-center gap-1.5 text-xs">
                    F
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={movement.loadFemale ?? ""}
                      onChange={(event) =>
                        patchMovement(blockIndex, movementIndex, {
                          loadFemale: toNumber(event.target.value),
                        })
                      }
                      aria-label="Charge femmes en kilogrammes"
                      className={cn(field, "w-20 font-mono tabular-nums")}
                    />
                  </label>

                  <input
                    value={movement.target ?? ""}
                    onChange={(event) =>
                      patchMovement(blockIndex, movementIndex, {
                        target: event.target.value === "" ? null : event.target.value,
                      })
                    }
                    placeholder="60 / 50 cm, 500 m…"
                    aria-label="Hauteur, distance ou calories"
                    className={cn(field, "w-40")}
                  />

                  <IconButton
                    label="Retirer le mouvement"
                    danger
                    onClick={() => {
                      patchBlock(blockIndex, {
                        movements: block.movements.filter((_, index) => index !== movementIndex),
                      });
                    }}
                  >
                    ✕
                  </IconButton>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  patchBlock(blockIndex, { movements: [...block.movements, emptyMovement()] })
                }
                className="border-edge text-chalk-faint hover:text-chalk-dim hover:border-edge focus-visible:ring-brand rounded-xl border border-dashed px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                + Ajouter un mouvement
              </button>
            </div>

            <input
              value={block.notes ?? ""}
              onChange={(event) =>
                patchBlock(blockIndex, {
                  notes: event.target.value === "" ? null : event.target.value,
                })
              }
              placeholder="Consigne du bloc (facultatif)"
              aria-label="Consigne du bloc"
              className={cn(field, "w-full")}
            />
          </Card>
        ))}

        <button
          type="button"
          onClick={() => {
            setBlocks((current) => [...current, emptyBlock()]);
            setSaved(false);
          }}
          className="border-edge text-chalk-dim hover:bg-white/4 focus-visible:ring-brand rounded-2xl border border-dashed p-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          + Ajouter un bloc
        </button>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-chalk-faint font-mono text-[11px] tracking-[0.18em] uppercase">
          Note du coach
        </span>
        <textarea
          value={coachNotes}
          onChange={(event) => {
            setCoachNotes(event.target.value);
            setSaved(false);
          }}
          rows={3}
          placeholder="Ce que tu veux dire à la classe avant de lancer le chrono."
          className={cn(field, "resize-y")}
        />
      </label>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "border-edge-soft flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
        danger
          ? "text-chalk-faint hover:text-urgent hover:border-urgent/50 focus-visible:ring-urgent"
          : "text-chalk-dim hover:bg-white/8 focus-visible:ring-brand",
      )}
    >
      {children}
    </button>
  );
}
