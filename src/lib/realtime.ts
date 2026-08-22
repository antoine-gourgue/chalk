import "server-only";
import type { TimerCommand } from "@/lib/timer-command";

/**
 * Relais des commandes de chrono vers la passerelle temps réel.
 *
 * L'autorisation a déjà été vérifiée côté Next : la passerelle fait confiance au
 * secret partagé, et n'est jamais exposée directement aux navigateurs pour les
 * commandes.
 */
export async function sendTimerCommand(command: TimerCommand): Promise<boolean> {
  const url = process.env.REALTIME_URL;
  const secret = process.env.REALTIME_SECRET;
  if (!url || !secret) {
    console.error("REALTIME_URL ou REALTIME_SECRET manquant : commande non transmise");
    return false;
  }

  try {
    const response = await fetch(`${url}/command`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-chalk-secret": secret },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    return response.ok;
  } catch (error) {
    console.error("passerelle temps réel injoignable", error);
    return false;
  }
}
