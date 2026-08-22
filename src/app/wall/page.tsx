import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChalkMark } from "@/components/chalk-mark";
import { PairWallForm } from "@/components/pair-wall-form";
import { prisma } from "@/lib/db";
import { WALL_COOKIE } from "@/lib/pairing";

export const metadata = { title: "Appairer l'écran · Chalk" };

export default async function WallPairingPage() {
  const token = (await cookies()).get(WALL_COOKIE)?.value;
  if (token !== undefined) {
    const device = await prisma.wallDevice.findUnique({ where: { token } });
    if (device !== null) {
      redirect("/wall/live");
    }
  }

  return (
    <main className="relative flex h-dvh flex-col items-center justify-center gap-10 overflow-hidden bg-[radial-gradient(120%_90%_at_50%_0%,#241243_0%,#0b0616_60%,#060310_100%)] px-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <ChalkMark className="h-14 w-14" />
        <h1 className="text-5xl font-black tracking-[-0.035em]">Appairer cet écran</h1>
        <p className="text-chalk-dim max-w-md text-lg">
          Dans l&apos;espace coach, ouvre <span className="text-chalk">Écrans</span> et génère un
          code. Tu as un quart d&apos;heure pour le saisir ici.
        </p>
      </div>

      <PairWallForm />
    </main>
  );
}
