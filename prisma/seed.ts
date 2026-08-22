import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient, type Modality, type PrUnit } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL est absent : copie .env.example vers .env.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type MovementSeed = {
  slug: string;
  name: string;
  modality: Modality;
  benchmark?: boolean;
  prUnit?: PrUnit;
};

/** Catalogue commun, partagé par toutes les salles. */
const MOVEMENTS: MovementSeed[] = [
  {
    slug: "back-squat",
    name: "Back squat",
    modality: "WEIGHTLIFTING",
    benchmark: true,
    prUnit: "KG",
  },
  {
    slug: "front-squat",
    name: "Front squat",
    modality: "WEIGHTLIFTING",
    benchmark: true,
    prUnit: "KG",
  },
  {
    slug: "overhead-squat",
    name: "Overhead squat",
    modality: "WEIGHTLIFTING",
    benchmark: true,
    prUnit: "KG",
  },
  { slug: "deadlift", name: "Deadlift", modality: "WEIGHTLIFTING", benchmark: true, prUnit: "KG" },
  { slug: "sumo-deadlift-high-pull", name: "Sumo deadlift high pull", modality: "WEIGHTLIFTING" },
  { slug: "clean", name: "Clean", modality: "WEIGHTLIFTING", benchmark: true, prUnit: "KG" },
  {
    slug: "power-clean",
    name: "Power clean",
    modality: "WEIGHTLIFTING",
    benchmark: true,
    prUnit: "KG",
  },
  { slug: "hang-clean", name: "Hang clean", modality: "WEIGHTLIFTING" },
  {
    slug: "clean-and-jerk",
    name: "Clean and jerk",
    modality: "WEIGHTLIFTING",
    benchmark: true,
    prUnit: "KG",
  },
  { slug: "snatch", name: "Snatch", modality: "WEIGHTLIFTING", benchmark: true, prUnit: "KG" },
  {
    slug: "power-snatch",
    name: "Power snatch",
    modality: "WEIGHTLIFTING",
    benchmark: true,
    prUnit: "KG",
  },
  {
    slug: "push-press",
    name: "Push press",
    modality: "WEIGHTLIFTING",
    benchmark: true,
    prUnit: "KG",
  },
  { slug: "push-jerk", name: "Push jerk", modality: "WEIGHTLIFTING" },
  {
    slug: "split-jerk",
    name: "Split jerk",
    modality: "WEIGHTLIFTING",
    benchmark: true,
    prUnit: "KG",
  },
  {
    slug: "strict-press",
    name: "Strict press",
    modality: "WEIGHTLIFTING",
    benchmark: true,
    prUnit: "KG",
  },
  { slug: "thruster", name: "Thruster", modality: "WEIGHTLIFTING" },
  {
    slug: "bench-press",
    name: "Bench press",
    modality: "WEIGHTLIFTING",
    benchmark: true,
    prUnit: "KG",
  },
  { slug: "kettlebell-swing", name: "Kettlebell swing", modality: "WEIGHTLIFTING" },
  { slug: "dumbbell-snatch", name: "Dumbbell snatch", modality: "WEIGHTLIFTING" },
  { slug: "wall-ball", name: "Wall ball", modality: "WEIGHTLIFTING" },
  { slug: "turkish-get-up", name: "Turkish get-up", modality: "WEIGHTLIFTING" },
  { slug: "farmer-carry", name: "Farmer carry", modality: "WEIGHTLIFTING" },

  { slug: "pull-up", name: "Pull-up", modality: "GYMNASTICS", benchmark: true, prUnit: "REPS" },
  { slug: "chest-to-bar", name: "Chest-to-bar", modality: "GYMNASTICS" },
  {
    slug: "strict-pull-up",
    name: "Strict pull-up",
    modality: "GYMNASTICS",
    benchmark: true,
    prUnit: "REPS",
  },
  { slug: "toes-to-bar", name: "Toes-to-bar", modality: "GYMNASTICS" },
  { slug: "knees-to-elbow", name: "Knees-to-elbow", modality: "GYMNASTICS" },
  { slug: "muscle-up", name: "Muscle-up", modality: "GYMNASTICS", benchmark: true, prUnit: "REPS" },
  { slug: "ring-muscle-up", name: "Ring muscle-up", modality: "GYMNASTICS" },
  { slug: "bar-muscle-up", name: "Bar muscle-up", modality: "GYMNASTICS" },
  {
    slug: "handstand-push-up",
    name: "Handstand push-up",
    modality: "GYMNASTICS",
    benchmark: true,
    prUnit: "REPS",
  },
  { slug: "handstand-walk", name: "Handstand walk", modality: "GYMNASTICS" },
  { slug: "push-up", name: "Push-up", modality: "GYMNASTICS" },
  { slug: "ring-dip", name: "Ring dip", modality: "GYMNASTICS" },
  { slug: "dip", name: "Dip", modality: "GYMNASTICS" },
  { slug: "burpee", name: "Burpee", modality: "GYMNASTICS" },
  { slug: "burpee-box-jump-over", name: "Burpee box jump over", modality: "GYMNASTICS" },
  { slug: "box-jump", name: "Box jump", modality: "GYMNASTICS" },
  { slug: "pistol", name: "Pistol", modality: "GYMNASTICS" },
  { slug: "air-squat", name: "Air squat", modality: "GYMNASTICS" },
  { slug: "sit-up", name: "Sit-up", modality: "GYMNASTICS" },
  { slug: "rope-climb", name: "Rope climb", modality: "GYMNASTICS" },
  { slug: "l-sit", name: "L-sit", modality: "GYMNASTICS", benchmark: true, prUnit: "SECONDS" },
  { slug: "toes-through-rings", name: "Toes through rings", modality: "GYMNASTICS" },

  { slug: "row", name: "Rameur", modality: "MONOSTRUCTURAL" },
  { slug: "bike-erg", name: "Bike erg", modality: "MONOSTRUCTURAL" },
  { slug: "assault-bike", name: "Assault bike", modality: "MONOSTRUCTURAL" },
  { slug: "ski-erg", name: "Ski erg", modality: "MONOSTRUCTURAL" },
  { slug: "run", name: "Course", modality: "MONOSTRUCTURAL" },
  { slug: "shuttle-run", name: "Navette", modality: "MONOSTRUCTURAL" },
  { slug: "double-under", name: "Double under", modality: "MONOSTRUCTURAL" },
  { slug: "single-under", name: "Single under", modality: "MONOSTRUCTURAL" },
  { slug: "sled-push", name: "Sled push", modality: "MONOSTRUCTURAL" },
  { slug: "swim", name: "Natation", modality: "MONOSTRUCTURAL" },

  { slug: "bulgarian-split-squat", name: "Bulgarian split squat", modality: "ACCESSORY" },
  { slug: "good-morning", name: "Good morning", modality: "ACCESSORY" },
  { slug: "back-extension", name: "Back extension", modality: "ACCESSORY" },
  {
    slug: "hollow-hold",
    name: "Hollow hold",
    modality: "ACCESSORY",
    benchmark: true,
    prUnit: "SECONDS",
  },
  { slug: "plank", name: "Gainage", modality: "ACCESSORY", benchmark: true, prUnit: "SECONDS" },
  { slug: "banded-pull-apart", name: "Banded pull-apart", modality: "ACCESSORY" },
  { slug: "shoulder-mobility", name: "Mobilité épaules", modality: "ACCESSORY" },
  { slug: "hip-mobility", name: "Mobilité hanches", modality: "ACCESSORY" },
];

function toDayDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function main(): Promise<void> {
  /**
   * Pas d'upsert ici : la contrainte unique porte sur `boxId` qui est nul pour le
   * catalogue commun, et Postgres ne fait jamais correspondre deux NULL entre eux.
   */
  for (const movement of MOVEMENTS) {
    const existing = await prisma.movement.findFirst({
      where: { boxId: null, slug: movement.slug },
    });
    if (existing) {
      await prisma.movement.update({
        where: { id: existing.id },
        data: { name: movement.name, modality: movement.modality },
      });
      continue;
    }
    await prisma.movement.create({
      data: {
        slug: movement.slug,
        name: movement.name,
        modality: movement.modality,
        benchmark: movement.benchmark ?? false,
        prUnit: movement.prUnit ?? null,
      },
    });
  }
  console.log(`✓ ${MOVEMENTS.length} mouvements dans le catalogue`);

  const box = await prisma.box.upsert({
    where: { slug: "demo" },
    update: {},
    create: { slug: "demo", name: "CrossFit Ouest", demo: true },
  });

  const passwordHash = await hash("chalk", 10);
  const coach = await prisma.user.upsert({
    where: { email: "lea@chalk.demo" },
    update: {},
    create: { email: "lea@chalk.demo", name: "Léa Marchand", passwordHash },
  });
  await prisma.membership.upsert({
    where: { boxId_userId: { boxId: box.id, userId: coach.id } },
    update: { role: "OWNER" },
    create: { boxId: box.id, userId: coach.id, role: "OWNER" },
  });

  const memberNames = [
    "Malik Benali",
    "Camille Dubois",
    "Sonia Kaci",
    "Thomas Renard",
    "Inès Faure",
    "Hugo Lemaire",
  ];
  for (const [index, name] of memberNames.entries()) {
    const email = `membre${index + 1}@chalk.demo`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, passwordHash },
    });
    await prisma.membership.upsert({
      where: { boxId_userId: { boxId: box.id, userId: user.id } },
      update: {},
      create: { boxId: box.id, userId: user.id, role: "MEMBER" },
    });
  }
  console.log(`✓ salle ${box.name} avec ${memberNames.length + 1} personnes`);

  for (const weekday of [1, 2, 3, 4, 5]) {
    for (const startTime of ["06:30", "12:15", "17:30", "18:30", "19:30"]) {
      const existing = await prisma.classSlot.findFirst({
        where: { boxId: box.id, weekday, startTime },
      });
      if (!existing) {
        await prisma.classSlot.create({
          data: { boxId: box.id, weekday, startTime, capacity: 16, coachId: coach.id },
        });
      }
    }
  }
  console.log("✓ 25 créneaux hebdomadaires");

  const movementBySlug = new Map(
    (await prisma.movement.findMany({ where: { boxId: null } })).map((m) => [m.slug, m.id]),
  );

  /**
   * La séance principale est datée d'aujourd'hui, pas d'un jour fixe : la salle de
   * démonstration doit toujours avoir quelque chose à afficher au mur, quel que
   * soit le jour où on la visite.
   */
  const today = toDayDate(new Date());
  const existingWorkout = await prisma.workout.findUnique({
    where: { boxId_date: { boxId: box.id, date: today } },
  });

  if (!existingWorkout) {
    await prisma.workout.create({
      data: {
        boxId: box.id,
        date: today,
        title: "AMRAP 12",
        coachNotes: "Garder un rythme régulier sur les thrusters, ne pas partir trop vite.",
        publishedAt: new Date(),
        blocks: {
          create: [
            {
              position: 0,
              kind: "WARMUP",
              format: "FREE",
              title: "Mobilité épaules",
              durationSeconds: 600,
              movements: {
                create: [
                  {
                    position: 0,
                    movementId: movementBySlug.get("shoulder-mobility")!,
                    target: "10 min",
                  },
                ],
              },
            },
            {
              position: 1,
              kind: "METCON",
              format: "AMRAP",
              title: "AMRAP 12",
              durationSeconds: 720,
              movements: {
                create: [
                  {
                    position: 0,
                    movementId: movementBySlug.get("thruster")!,
                    reps: 12,
                    loadMale: 43,
                    loadFemale: 30,
                  },
                  { position: 1, movementId: movementBySlug.get("toes-to-bar")!, reps: 9 },
                  {
                    position: 2,
                    movementId: movementBySlug.get("burpee-box-jump-over")!,
                    reps: 6,
                    target: "60 / 50 cm",
                  },
                ],
              },
            },
          ],
        },
      },
    });
    console.log("✓ séance du jour");
  }

  /**
   * Quelques scores sur le metcon, pour que le mur ait un classement à afficher
   * avant que la saisie de performance n'existe.
   *
   * `value` porte le total de répétitions effectuées — c'est lui qui classe, là
   * où « 5 + 14 » n'est qu'une façon de l'écrire.
   */
  const REPS_PER_ROUND = 27;
  const metcon = await prisma.block.findFirst({
    where: { workout: { boxId: box.id, date: today }, kind: "METCON" },
  });

  if (metcon !== null) {
    const scores: [string, number, number, boolean][] = [
      ["membre1@chalk.demo", 5, 14, true],
      ["membre2@chalk.demo", 5, 3, true],
      ["membre3@chalk.demo", 4, 21, false],
      ["membre4@chalk.demo", 4, 9, true],
      ["membre5@chalk.demo", 3, 18, false],
    ];

    for (const [email, rounds, reps, rx] of scores) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user === null) {
        continue;
      }
      await prisma.result.upsert({
        where: { blockId_userId: { blockId: metcon.id, userId: user.id } },
        update: {},
        create: {
          blockId: metcon.id,
          userId: user.id,
          scoreType: "ROUNDS_REPS",
          value: rounds * REPS_PER_ROUND + reps,
          rounds,
          reps,
          rx,
        },
      });
    }
    console.log(`✓ ${scores.length} scores sur le metcon`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
