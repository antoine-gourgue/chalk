import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL est absent : copie .env.example vers .env.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/**
 * Client Prisma partagé, instancié à la première utilisation réelle.
 *
 * La paresse n'est pas un détail : `next build` importe chaque route pour en
 * collecter la configuration, sans base de données. Un client construit au
 * chargement du module ferait donc échouer le build en intégration continue,
 * là où aucune `DATABASE_URL` n'est fournie.
 *
 * L'instance est mémorisée sur l'objet global pour survivre aux rechargements à
 * chaud du développement, qui épuiseraient sinon les connexions.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = (globalForPrisma.prisma ??= createPrismaClient());
    const value = Reflect.get(client, property) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
});
