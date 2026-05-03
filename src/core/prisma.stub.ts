// Stub para evitar que Jest (modo CJS) falle al parsear el cliente generado de Prisma
// que usa import.meta.url (sintaxis ESM). Este stub se usa solo en tests.
export class PrismaClient {
  constructor(_opts?: any) {}
  $connect() { return Promise.resolve(); }
  $disconnect() { return Promise.resolve(); }
  $transaction(fn: any) { return fn(this); }
  $queryRawUnsafe() { return Promise.resolve([]); }
}
