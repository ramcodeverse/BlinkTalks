import { PrismaClient } from "@prisma/client";

let prisma: any = null;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    try {
      prisma = new PrismaClient();
    } catch (err) {
      console.warn("[AI Studio] Database not connected — using resilient mock proxy:", err);
      const noOp = {
        findMany: async () => [],
        findFirst: async () => null,
        findUnique: async () => null,
        create: async (d: any) => d?.data ?? {},
        update: async (d: any) => d?.data ?? {},
        delete: async () => ({}),
        count: async () => 0,
      };
      prisma = new Proxy({}, { get: () => noOp });
    }
  }
  return prisma;
}
