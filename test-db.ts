import { prisma } from './src/core/prisma';

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe('SELECT 1 as test');
    console.log('DB OK:', result);
    process.exit(0);
  } catch (e: any) {
    console.error('DB ERROR:', e.message);
    process.exit(1);
  }
}

main();
