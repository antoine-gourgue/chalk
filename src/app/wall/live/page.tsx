import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WallDisplay } from "@/components/wall-display";
import { formatDayLong, todayIn } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { WALL_COOKIE } from "@/lib/pairing";
import { getWallData } from "@/lib/wall-data";

export const metadata = { title: "Le mur · Chalk" };

/** L'écran de la salle se rafraîchit souvent : jamais de cache. */
export const dynamic = "force-dynamic";

export default async function WallLivePage() {
  const token = (await cookies()).get(WALL_COOKIE)?.value;
  if (token === undefined) {
    redirect("/wall");
  }

  const device = await prisma.wallDevice.findUnique({
    where: { token },
    include: { box: true },
  });
  if (device === null) {
    redirect("/wall");
  }

  await prisma.wallDevice.update({
    where: { id: device.id },
    data: { lastSeen: new Date() },
  });

  const { blocks, scores } = await getWallData(device.box);

  return (
    <WallDisplay
      boxSlug={device.box.slug}
      header={`${formatDayLong(todayIn(device.box.timezone))} · ${device.box.name}`}
      blocks={blocks}
      scores={scores}
    />
  );
}
