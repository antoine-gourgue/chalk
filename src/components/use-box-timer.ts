"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  clockOffset,
  isFinalCountdown,
  progressRatio,
  remainingSeconds,
  type TimerState,
} from "@/lib/timer";

export type BoxTimer = {
  timer: TimerState | null;
  remaining: number;
  progress: number;
  finalCountdown: boolean;
  connected: boolean;
};

/** Dix images par seconde suffisent pour des secondes rondes et un anneau fluide. */
const TICK_MS = 100;

/**
 * Abonnement au chrono d'une salle.
 *
 * Le serveur n'envoie qu'un état et son horloge ; l'affichage est recalculé
 * localement. La dérive d'horloge du poste est mesurée à chaque message reçu, de
 * sorte que le mur et les téléphones montrent la même seconde même si leurs
 * horloges divergent.
 */
export function useBoxTimer(boxSlug: string): BoxTimer {
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [offset, setOffset] = useState(0);
  const [connected, setConnected] = useState(false);
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:3100";
    const socket: Socket = io(url, { transports: ["websocket", "polling"] });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("box:join", boxSlug);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("timer:state", (payload: { timer: TimerState | null; serverNow: number }) => {
      setOffset(clockOffset(payload.serverNow, Date.now()));
      setTimer(payload.timer);
    });

    return () => {
      socket.emit("box:leave", boxSlug);
      socket.disconnect();
    };
  }, [boxSlug]);

  useEffect(() => {
    const interval = setInterval(() => setClock(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const now = clock + offset;

  return {
    timer,
    remaining: timer === null ? 0 : remainingSeconds(timer, now),
    progress: timer === null ? 0 : progressRatio(timer, now),
    finalCountdown: timer !== null && isFinalCountdown(timer, now),
    connected,
  };
}
