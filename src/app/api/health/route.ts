/** Sonde utilisée par le HEALTHCHECK de l'image Docker. */
export function GET() {
  return Response.json({ status: "ok" });
}
