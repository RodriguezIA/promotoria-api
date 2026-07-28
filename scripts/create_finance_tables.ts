import { prisma } from "../src/core/prisma";

const TABLES_SQL = `
CREATE TABLE IF NOT EXISTS client_charges (
  id_charge           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_client            INT UNSIGNED NOT NULL,
  vc_folio             VARCHAR(50)  NULL,
  dt_start             DATETIME     NOT NULL,
  dt_end               DATETIME     NOT NULL,
  f_total              DECIMAL(10,2) NOT NULL,
  id_status            INT          NOT NULL DEFAULT 1,
  dt_payment           DATETIME     NULL,
  vc_payment_method    VARCHAR(50)  NULL,
  vc_rejection_reason  VARCHAR(500) NULL,
  id_user_creator      INT UNSIGNED NOT NULL,
  id_user_validator    INT UNSIGNED NULL,
  dt_register          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dt_updated           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_client_charges_folio (vc_folio),
  KEY idx_client_charges_client_status (id_client, id_status),
  CONSTRAINT fk_client_charges_client FOREIGN KEY (id_client) REFERENCES clients (id_client)
)
`;

const TABLE_CLIENT_CHARGE_ORDERS_SQL = `
CREATE TABLE IF NOT EXISTS client_charge_orders (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_charge   INT UNSIGNED NOT NULL,
  id_order    INT UNSIGNED NOT NULL,
  f_amount    DECIMAL(10,2) NOT NULL,
  dt_register TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_charge_order (id_charge, id_order),
  KEY idx_charge_orders_order (id_order),
  CONSTRAINT fk_charge_orders_charge FOREIGN KEY (id_charge) REFERENCES client_charges (id_charge),
  CONSTRAINT fk_charge_orders_order FOREIGN KEY (id_order) REFERENCES orders (id_order)
)
`;

const TABLE_CLIENT_CHARGE_TASKS_SQL = `
CREATE TABLE IF NOT EXISTS client_charge_tasks (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_charge   INT UNSIGNED NOT NULL,
  id_order    INT UNSIGNED NOT NULL,
  id_task     INT UNSIGNED NOT NULL,
  f_amount    DECIMAL(10,2) NOT NULL,
  dt_register TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_charge_task (id_charge, id_task),
  KEY idx_charge_tasks_task (id_task),
  CONSTRAINT fk_charge_tasks_charge FOREIGN KEY (id_charge) REFERENCES client_charges (id_charge),
  CONSTRAINT fk_charge_tasks_task FOREIGN KEY (id_task) REFERENCES tasks (id_task)
)
`;

const TABLE_CLIENT_CHARGE_LOGS_SQL = `
CREATE TABLE IF NOT EXISTS client_charge_logs (
  id_charge_log INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_charge     INT UNSIGNED NOT NULL,
  id_user       INT UNSIGNED NOT NULL,
  vc_log        VARCHAR(1000) NOT NULL,
  i_status      TINYINT      NOT NULL DEFAULT 1,
  dt_register   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_client_charge_logs_charge (id_charge)
)
`;

const TABLE_PROMOTER_PAYMENTS_SQL = `
CREATE TABLE IF NOT EXISTS promoter_payments (
  id_payment      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_promoter     INT UNSIGNED NOT NULL,
  vc_folio        VARCHAR(50)  NULL,
  dt_start        DATETIME     NOT NULL,
  dt_end          DATETIME     NOT NULL,
  f_total         DECIMAL(10,2) NOT NULL,
  id_status       INT          NOT NULL DEFAULT 1,
  id_bank_account INT UNSIGNED NULL,
  dt_payment      DATETIME     NULL,
  vc_notes        VARCHAR(500) NULL,
  id_user_creator INT UNSIGNED NOT NULL,
  id_user_payer   INT UNSIGNED NULL,
  dt_register     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dt_updated      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_promoter_payments_folio (vc_folio),
  KEY idx_promoter_payments_promoter_status (id_promoter, id_status),
  CONSTRAINT fk_promoter_payments_promoter FOREIGN KEY (id_promoter) REFERENCES promoters (id)
)
`;

const TABLE_PROMOTER_PAYMENT_TASKS_SQL = `
CREATE TABLE IF NOT EXISTS promoter_payment_tasks (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_payment  INT UNSIGNED NOT NULL,
  id_task     INT UNSIGNED NOT NULL,
  f_amount    DECIMAL(10,2) NOT NULL,
  dt_register TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_task (id_payment, id_task),
  KEY idx_payment_tasks_task (id_task),
  CONSTRAINT fk_payment_tasks_payment FOREIGN KEY (id_payment) REFERENCES promoter_payments (id_payment),
  CONSTRAINT fk_payment_tasks_task FOREIGN KEY (id_task) REFERENCES tasks (id_task)
)
`;

const TABLE_PROMOTER_PAYMENT_LOGS_SQL = `
CREATE TABLE IF NOT EXISTS promoter_payment_logs (
  id_payment_log INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_payment     INT UNSIGNED NOT NULL,
  id_user        INT UNSIGNED NOT NULL,
  vc_log         VARCHAR(1000) NOT NULL,
  i_status       TINYINT      NOT NULL DEFAULT 1,
  dt_register    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_promoter_payment_logs_payment (id_payment)
)
`;

const TABLE_FINANCE_SETTINGS_SQL = `
CREATE TABLE IF NOT EXISTS finance_settings (
  id_setting                        INT NOT NULL PRIMARY KEY,
  f_promoter_commission_percentage  DECIMAL(5,2) NOT NULL DEFAULT 0,
  id_system_client                  INT UNSIGNED NOT NULL,
  id_user_updater                   INT UNSIGNED NULL,
  dt_updated                        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_finance_settings_system_client FOREIGN KEY (id_system_client) REFERENCES clients (id_client)
)
`;

async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ c: number }[]>(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    name,
  );
  return Number(rows[0]?.c) === 1;
}

async function main() {
  // Orden importa: las tablas hijas referencian a las padre por FK.
  await prisma.$executeRawUnsafe(TABLES_SQL);
  await prisma.$executeRawUnsafe(TABLE_CLIENT_CHARGE_ORDERS_SQL);
  await prisma.$executeRawUnsafe(TABLE_CLIENT_CHARGE_TASKS_SQL);
  await prisma.$executeRawUnsafe(TABLE_CLIENT_CHARGE_LOGS_SQL);
  await prisma.$executeRawUnsafe(TABLE_PROMOTER_PAYMENTS_SQL);
  await prisma.$executeRawUnsafe(TABLE_PROMOTER_PAYMENT_TASKS_SQL);
  await prisma.$executeRawUnsafe(TABLE_PROMOTER_PAYMENT_LOGS_SQL);
  await prisma.$executeRawUnsafe(TABLE_FINANCE_SETTINGS_SQL);

  for (const table of [
    "client_charges",
    "client_charge_orders",
    "client_charge_tasks",
    "client_charge_logs",
    "promoter_payments",
    "promoter_payment_tasks",
    "promoter_payment_logs",
    "finance_settings",
  ]) {
    console.log(`${table} table present:`, await tableExists(table));
  }

  // Seed: cliente sistema usado como ancla del contador global de folios de pagos a promotores.
  const existingSystemClient = await prisma.clients.findFirst({
    where: { vc_initialism: "SYS" },
    select: { id_client: true },
  });

  let id_system_client: number;
  if (existingSystemClient) {
    id_system_client = existingSystemClient.id_client;
    console.log("Cliente sistema ya existía:", id_system_client);
  } else {
    const superAdmin = await prisma.users.findFirst({
      where: { i_rol: 1 },
      select: { id_user: true },
    });
    if (!superAdmin) {
      throw new Error(
        "No existe ningún usuario con i_rol = 1 (Super). Se necesita al menos uno para crear el cliente sistema de finanzas.",
      );
    }
    const created = await prisma.clients.create({
      data: {
        id_user: superAdmin.id_user,
        name: "Sistema (Pagos a Promotores)",
        vc_initialism: "SYS",
        i_status: 1,
      },
      select: { id_client: true },
    });
    id_system_client = created.id_client;
    console.log("Cliente sistema creado:", id_system_client);
  }

  // Seed: fila única de configuración de finanzas.
  const existingSettings = await prisma.finance_settings.findUnique({
    where: { id_setting: 1 },
  });
  if (!existingSettings) {
    await prisma.finance_settings.create({
      data: {
        id_setting: 1,
        f_promoter_commission_percentage: 0,
        id_system_client,
      },
    });
    console.log("finance_settings inicializado (porcentaje pendiente de configurar).");
  } else {
    console.log("finance_settings ya existía, no se modifica.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
