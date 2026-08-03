import { prisma } from "../src/core/prisma";

const CHECK_COLUMN_SQL = `
SELECT COUNT(*) AS c
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'task_rejections'
  AND column_name = 'reason'
`;

const ADD_COLUMN_SQL = `
ALTER TABLE task_rejections
  ADD COLUMN reason VARCHAR(20) NOT NULL DEFAULT 'rejected' AFTER id_promoter
`;

// NOTA: task_rejections.id_task/id_promoter son int(11) con signo, mientras
// que tasks.id_task y promoters.id son int unsigned. MySQL no permite crear
// FK entre tipos con signedness distinto (errno 150), y cambiar el tipo de
// columnas existentes en producción es más riesgo del que vale la pena solo
// para esto. Prisma resuelve el join en `include` a nivel de aplicación sin
// necesitar la FK en la base de datos, así que no la agregamos.

async function columnExists() {
  const rows = await prisma.$queryRawUnsafe<{ c: number }[]>(CHECK_COLUMN_SQL);
  return Number(rows[0]?.c) > 0;
}

async function main() {
  if (!(await columnExists())) {
    await prisma.$executeRawUnsafe(ADD_COLUMN_SQL);
    console.log("task_rejections.reason column created.");
  } else {
    console.log("task_rejections.reason column already exists, skipping.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
