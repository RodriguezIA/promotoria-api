import { prisma } from "../src/core/prisma";

const CHECK_COLUMNS_SQL = `
SELECT column_name AS c
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'tasks'
  AND column_name IN ('vc_cancel_reason', 'vc_cancel_type')
`;

const ADD_REASON_SQL = `
ALTER TABLE tasks
  ADD COLUMN vc_cancel_reason TEXT NULL AFTER id_status
`;

const ADD_TYPE_SQL = `
ALTER TABLE tasks
  ADD COLUMN vc_cancel_type VARCHAR(20) NULL AFTER vc_cancel_reason
`;

async function existingColumns() {
  const rows = await prisma.$queryRawUnsafe<{ c: string }[]>(CHECK_COLUMNS_SQL);
  return new Set(rows.map((r) => r.c));
}

async function main() {
  const existing = await existingColumns();

  if (!existing.has("vc_cancel_reason")) {
    await prisma.$executeRawUnsafe(ADD_REASON_SQL);
    console.log("tasks.vc_cancel_reason column created.");
  } else {
    console.log("tasks.vc_cancel_reason already exists, skipping.");
  }

  if (!existing.has("vc_cancel_type")) {
    await prisma.$executeRawUnsafe(ADD_TYPE_SQL);
    console.log("tasks.vc_cancel_type column created.");
  } else {
    console.log("tasks.vc_cancel_type already exists, skipping.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
