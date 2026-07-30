import { prisma } from "../src/core/prisma";

const DEDUPE_SQL = `
DELETE a FROM task_answers a
JOIN task_answers b
  ON a.id_task = b.id_task
  AND a.id_promoter = b.id_promoter
  AND a.id_request_product_question = b.id_request_product_question
  AND a.id_task_answer < b.id_task_answer
`;

const CHECK_INDEX_SQL = `
SELECT COUNT(*) AS c
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name = 'task_answers'
  AND index_name = 'uq_task_answers'
`;

const ADD_INDEX_SQL = `
ALTER TABLE task_answers
  ADD UNIQUE KEY uq_task_answers (id_task, id_promoter, id_request_product_question)
`;

async function main() {
  const deleteResult = await prisma.$executeRawUnsafe(DEDUPE_SQL);
  console.log(`Duplicate rows deleted from task_answers: ${deleteResult}`);

  const existing = await prisma.$queryRawUnsafe<{ c: number }[]>(CHECK_INDEX_SQL);
  const indexExists = Number(existing[0]?.c) > 0;

  if (!indexExists) {
    await prisma.$executeRawUnsafe(ADD_INDEX_SQL);
    console.log("uq_task_answers index created.");
  } else {
    console.log("uq_task_answers index already exists, skipping creation.");
  }

  const verify = await prisma.$queryRawUnsafe<{ c: number }[]>(CHECK_INDEX_SQL);
  const verified = Number(verify[0]?.c) > 0;
  console.log("uq_task_answers index present:", verified);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
