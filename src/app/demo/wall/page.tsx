import { notFound } from "next/navigation";
import { WallDisplay } from "@/components/wall-display";
import { formatDayLong, todayIn } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { getWallData } from "@/lib/wall-data";

export const metadata = { title: "Le mur en démonstration · Chalk" };
export const dynamic = "force-dynamic";

/**
 * Le mur de la salle de démonstration, ouvert à tous et sans appairage.
 *
 * C'est la vitrine : un visiteur voit l'écran exactement tel qu'il tourne dans
 * une salle, sans avoir à créer de compte ni à posséder d'écran.
 */
export default async function DemoWallPage() {
  const box = await prisma.box.findFirst({ where: { slug: "demo", demo: true } });
  if (box === null) {
    notFound();
  }

  const { blocks, scores } = await getWallData(box);

  return (
    <WallDisplay
      boxSlug={box.slug}
      header={`${formatDayLong(todayIn(box.timezone))} · ${box.name}`}
      blocks={blocks}
      scores={scores}
    />
  );
}
