import type { WallBlock, WallScore } from "@/components/wall-display";
import { todayIn } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { compareResults, formatScore, type ScoreType } from "@/lib/score";
import { getWorkoutByDate } from "@/lib/workouts";

/**
 * Ce qu'un écran affiche pour une salle donnée : la séance du jour et son
 * classement. Partagé par le mur appairé et le mur public de démonstration, pour
 * que les deux ne divergent jamais.
 */
export async function getWallData(box: { id: string; timezone: string }): Promise<{
  blocks: WallBlock[];
  scores: WallScore[];
}> {
  const workout = await getWorkoutByDate(box.id, todayIn(box.timezone));

  const blocks: WallBlock[] =
    workout?.blocks.map((block) => ({
      id: block.id,
      kind: block.kind,
      format: block.format,
      title: block.title ?? workout.title,
      durationSeconds: block.durationSeconds,
      movements: block.movements.map((entry) => ({
        id: entry.id,
        reps: entry.reps,
        name: entry.movement.name,
        detail:
          entry.target ??
          (entry.loadMale === null
            ? null
            : `${entry.loadMale} / ${entry.loadFemale ?? entry.loadMale} kg`),
      })),
    })) ?? [];

  const blockIds = blocks.map((block) => block.id);
  const results =
    blockIds.length === 0
      ? []
      : await prisma.result.findMany({
          where: { blockId: { in: blockIds } },
          include: { user: { select: { name: true } } },
        });

  /**
   * Le classement se fait en mémoire, pas en SQL : sur un « for time » c'est le
   * plus petit score qui gagne, et la règle vit dans `src/lib/score.ts` plutôt
   * que dupliquée dans une clause `orderBy`.
   */
  const scores: WallScore[] = results
    .map((result) => ({
      id: result.id,
      name: result.user.name,
      scoreType: result.scoreType as ScoreType,
      value: result.value,
      rounds: result.rounds,
      reps: result.reps,
      rx: result.rx,
    }))
    .sort(compareResults)
    .slice(0, 8)
    .map((result) => ({
      id: result.id,
      name: result.name,
      score: formatScore(result),
      rx: result.rx,
    }));

  return { blocks, scores };
}
