import { createServer } from "node:http";
import { Server } from "socket.io";

/**
 * Passerelle temps réel de Chalk.
 *
 * Règle fondatrice : le chrono ne se diffuse pas tick par tick. Le serveur
 * garde l'instant de départ du bloc et le renvoie à chaque écran, qui calcule
 * lui-même l'affichage. Sans cela, le mur et les téléphones divergent de
 * plusieurs secondes et le produit perd toute crédibilité en salle.
 */

type TimerState = {
  blockId: string;
  /** Horodatage serveur du départ, en millisecondes. */
  startedAt: number;
  /** Durée du bloc en secondes. */
  durationSeconds: number;
  pausedAt: number | null;
};

const timers = new Map<string, TimerState>();

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", rooms: timers.size }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: { origin: process.env.NEXT_PUBLIC_APP_URL ?? "*" },
});

io.on("connection", (socket) => {
  socket.on("box:join", (boxSlug: string) => {
    socket.join(boxSlug);
    const timer = timers.get(boxSlug);
    /** Corrige la dérive d'horloge du client dès la poignée de main. */
    socket.emit("timer:state", { timer, serverNow: Date.now() });
  });
});

httpServer.listen(Number(process.env.REALTIME_PORT ?? 3100), () => {
  console.log(`realtime gateway on :${process.env.REALTIME_PORT ?? 3100}`);
});
