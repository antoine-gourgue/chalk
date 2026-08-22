import { redirectToOwnBox } from "@/app/connexion/actions";

/** Aiguillage après connexion : chacun tombe sur la surface de son rôle. */
export default async function BoxIndexPage() {
  await redirectToOwnBox();
}
