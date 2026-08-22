import "dotenv/config";
import { createServer, type IncomingMessage } from "node:http";
import { Server } from "socket.io";
import { timerCommandSchema } from "../src/lib/timer-command";
import { pauseTimer, resetTimer, resumeTimer, startTimer, type TimerState } from "../src/lib/timer";

/**
 * Passerelle temps réel de Chalk.
 *
 * Elle ne détient qu'une chose : l'état du chrono de chaque salle. Elle ne
 * diffuse jamais de tick — elle envoie l'instant de départ et son horloge, et
 * chaque écran calcule ce qu'il affiche (voir `src/lib/timer.ts`).
 *
 * Elle ne connaît ni les comptes ni les rôles : c'est l'app Next qui vérifie
 * qu'une personne a le droit de piloter, puis relaie la commande signée par un
 * secret partagé. La passerelle reste donc bête, et l'autorisation garde un seul
 * endroit où vivre.
 */

const PORT = Number(process.env.REALTIME_PORT ?? 3100);
const SECRET = process.env.REALTIME_SECRET ?? "";

const timers = new Map<string, TimerState>();

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      /** Un corps de commande fait quelques centaines d'octets : au-delà, on coupe. */
      if (body.length > 4_096) {
        request.destroy();
        reject(new Error("payload too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function json(response: import("node:http").ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

const httpServer = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    json(response, 200, { status: "ok", boxes: timers.size });
    return;
  }

  if (request.method === "POST" && request.url === "/command") {
    if (SECRET === "" || request.headers["x-chalk-secret"] !== SECRET) {
      json(response, 401, { error: "unauthorized" });
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(await readBody(request));
    } catch {
      json(response, 400, { error: "invalid body" });
      return;
    }

    const parsed = timerCommandSchema.safeParse(payload);
    if (!parsed.success) {
      json(response, 400, { error: "invalid command" });
      return;
    }

    const command = parsed.data;
    const now = Date.now();
    const current = timers.get(command.boxSlug);

    let next: TimerState | undefined;
    if (command.command === "start") {
      next = startTimer(command.blockId, command.durationSeconds, now);
    } else if (current !== undefined) {
      if (command.command === "pause") {
        next = pauseTimer(current, now);
      } else if (command.command === "resume") {
        next = resumeTimer(current, now);
      } else {
        next = resetTimer(current);
      }
    }

    if (next === undefined) {
      json(response, 409, { error: "no timer running" });
      return;
    }

    timers.set(command.boxSlug, next);
    io.to(command.boxSlug).emit("timer:state", { timer: next, serverNow: Date.now() });
    json(response, 200, { timer: next, serverNow: Date.now() });
    return;
  }

  response.writeHead(404);
  response.end();
});

const io = new Server(httpServer, {
  cors: { origin: process.env.NEXT_PUBLIC_APP_URL ?? "*" },
});

io.on("connection", (socket) => {
  socket.on("box:join", (boxSlug: unknown) => {
    if (typeof boxSlug !== "string" || boxSlug === "") {
      return;
    }
    socket.join(boxSlug);
    /**
     * `serverNow` accompagne toujours l'état : c'est ce qui permet au client de
     * mesurer sa dérive d'horloge dès la poignée de main.
     */
    socket.emit("timer:state", { timer: timers.get(boxSlug) ?? null, serverNow: Date.now() });
  });

  socket.on("box:leave", (boxSlug: unknown) => {
    if (typeof boxSlug === "string") {
      socket.leave(boxSlug);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`passerelle temps réel sur :${PORT}`);
  if (SECRET === "") {
    console.warn("REALTIME_SECRET est vide : toutes les commandes seront refusées.");
  }
});
