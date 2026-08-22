import { BoxShell } from "@/components/box-shell";
import { PairingPanel, type DeviceRow } from "@/components/pairing-panel";
import { prisma } from "@/lib/db";
import { coachPage } from "@/lib/guard";

export default async function ScreensPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { box, user } = await coachPage(slug);

  const devices = await prisma.wallDevice.findMany({
    where: { boxId: box.id },
    orderBy: { createdAt: "desc" },
  });

  const rows: DeviceRow[] = devices.map((device) => ({
    id: device.id,
    name: device.name,
    paired: device.pairedAt !== null,
    pendingCode: device.pairingCode,
    expiresAt: device.pairingExpiresAt?.toISOString() ?? null,
    lastSeen: device.lastSeen?.toISOString() ?? null,
  }));

  return (
    <BoxShell slug={slug} boxName={box.name} userName={user.name} active="ecrans">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-7">
        <div>
          <p className="text-chalk-faint font-mono text-[11px] tracking-[0.18em] uppercase">
            Écrans
          </p>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em]">Le mur de la salle</h1>
          <p className="text-chalk-dim mt-2 text-sm">
            Sur l&apos;écran de la salle, ouvre <span className="text-chalk">/wall</span> et saisis
            le code généré ici. Une fois appairé, l&apos;écran reste connecté : il n&apos;a pas de
            compte, c&apos;est l&apos;appareil lui-même qui est reconnu.
          </p>
        </div>

        <PairingPanel slug={slug} devices={rows} />
      </main>
    </BoxShell>
  );
}
