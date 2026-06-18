import { prisma } from "../src/core/prisma";

const SQL = `
CREATE TABLE IF NOT EXISTS assets (
  id_asset    INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_client   INT UNSIGNED NULL,
  entity_type VARCHAR(50)  NOT NULL,
  entity_id   INT UNSIGNED NOT NULL,
  vc_folio    VARCHAR(50)  NULL,
  bucket_path VARCHAR(500) NOT NULL,
  vc_url      VARCHAR(500) NOT NULL,
  vc_mime     VARCHAR(100) NULL,
  i_size      INT          NULL,
  id_user     INT UNSIGNED NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_assets_entity (id_client, entity_type, entity_id, is_active)
)
`;

async function main() {
  await prisma.$executeRawUnsafe(SQL);
  const rows = await prisma.$queryRawUnsafe<{ c: number }[]>(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'assets'",
  );
  console.log("assets table present:", Number(rows[0]?.c) === 1);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
