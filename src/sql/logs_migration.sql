-- ============================================================
-- MIGRACIÓN: Estandarización y creación de tablas de logs
-- Campos requeridos en TODAS las tablas de log:
--   id_usuario, id_promotor, id_negocio, id_pais, vc_log, dt_registro
-- ============================================================

-- ============================================================
-- 1. ALTER TABLE — tablas existentes
--    Renombrar: log → vc_log, id_user → id_usuario
--    Agregar:   id_promotor, id_negocio, id_pais
-- ============================================================

ALTER TABLE user_logs
  CHANGE COLUMN `id_user`  `id_usuario`  INT(10) UNSIGNED NOT NULL,
  CHANGE COLUMN `log`      `vc_log`      VARCHAR(500) NOT NULL,
  ADD COLUMN `id_promotor` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_usuario`,
  ADD COLUMN `id_negocio`  INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_promotor`,
  ADD COLUMN `id_pais`     INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_negocio`;

ALTER TABLE client_logs
  CHANGE COLUMN `id_user`  `id_usuario`  INT(10) UNSIGNED NOT NULL,
  CHANGE COLUMN `log`      `vc_log`      VARCHAR(500) NOT NULL,
  ADD COLUMN `id_promotor` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_usuario`,
  ADD COLUMN `id_negocio`  INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_promotor`,
  ADD COLUMN `id_pais`     INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_negocio`;

ALTER TABLE store_logs
  CHANGE COLUMN `id_user`  `id_usuario`  INT(10) UNSIGNED NOT NULL,
  CHANGE COLUMN `log`      `vc_log`      VARCHAR(500) NOT NULL,
  ADD COLUMN `id_promotor` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_usuario`,
  ADD COLUMN `id_negocio`  INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_promotor`,
  ADD COLUMN `id_pais`     INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_negocio`;

ALTER TABLE question_logs
  CHANGE COLUMN `id_user`  `id_usuario`  INT(10) UNSIGNED NOT NULL,
  CHANGE COLUMN `log`      `vc_log`      VARCHAR(500) NOT NULL,
  ADD COLUMN `id_promotor` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_usuario`,
  ADD COLUMN `id_negocio`  INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_promotor`,
  ADD COLUMN `id_pais`     INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_negocio`;

ALTER TABLE question_client_logs
  CHANGE COLUMN `id_user`  `id_usuario`  INT(10) UNSIGNED NOT NULL,
  CHANGE COLUMN `log`      `vc_log`      VARCHAR(500) NOT NULL,
  ADD COLUMN `id_promotor` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_usuario`,
  ADD COLUMN `id_negocio`  INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_promotor`,
  ADD COLUMN `id_pais`     INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_negocio`;

ALTER TABLE product_logs
  CHANGE COLUMN `id_user`  `id_usuario`  INT(10) UNSIGNED NOT NULL,
  CHANGE COLUMN `log`      `vc_log`      VARCHAR(500) NOT NULL,
  ADD COLUMN `id_promotor` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_usuario`,
  ADD COLUMN `id_negocio`  INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_promotor`,
  ADD COLUMN `id_pais`     INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_negocio`;

ALTER TABLE quotation_logs
  CHANGE COLUMN `id_user`  `id_usuario`  INT(10) UNSIGNED NOT NULL,
  CHANGE COLUMN `log`      `vc_log`      VARCHAR(500) NOT NULL,
  ADD COLUMN `id_promotor` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_usuario`,
  ADD COLUMN `id_negocio`  INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_promotor`,
  ADD COLUMN `id_pais`     INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_negocio`;

ALTER TABLE service_order_logs
  CHANGE COLUMN `id_user`  `id_usuario`  INT(10) UNSIGNED NOT NULL,
  CHANGE COLUMN `log`      `vc_log`      VARCHAR(500) NOT NULL,
  ADD COLUMN `id_promotor` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_usuario`,
  ADD COLUMN `id_negocio`  INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_promotor`,
  ADD COLUMN `id_pais`     INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_negocio`;

ALTER TABLE ticket_logs
  CHANGE COLUMN `id_user`  `id_usuario`  INT(10) UNSIGNED NOT NULL,
  CHANGE COLUMN `log`      `vc_log`      VARCHAR(500) NOT NULL,
  ADD COLUMN `id_promotor` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_usuario`,
  ADD COLUMN `id_negocio`  INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_promotor`,
  ADD COLUMN `id_pais`     INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `id_negocio`;

-- ============================================================
-- 2. CREATE TABLE — tablas nuevas
-- ============================================================

CREATE TABLE IF NOT EXISTS request_logs (
  id_request_log  INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_request      INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_usuario      INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_promotor     INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_negocio      INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_pais         INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  vc_log          VARCHAR(500)        NOT NULL,
  i_status        TINYINT(4)          NOT NULL DEFAULT 1,
  dt_registro     TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_request   (id_request),
  INDEX idx_usuario   (id_usuario),
  INDEX idx_negocio   (id_negocio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_logs (
  id_order_log    INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_order        INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_usuario      INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_promotor     INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_negocio      INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_pais         INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  vc_log          VARCHAR(500)        NOT NULL,
  i_status        TINYINT(4)          NOT NULL DEFAULT 1,
  dt_registro     TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order     (id_order),
  INDEX idx_usuario   (id_usuario),
  INDEX idx_negocio   (id_negocio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS promoter_logs (
  id_promoter_log INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_promotor     INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_usuario      INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_negocio      INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_pais         INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  vc_log          VARCHAR(500)        NOT NULL,
  i_status        TINYINT(4)          NOT NULL DEFAULT 1,
  dt_registro     TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_promotor  (id_promotor),
  INDEX idx_usuario   (id_usuario),
  INDEX idx_negocio   (id_negocio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS service_logs (
  id_service_log  INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_service      INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_usuario      INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_promotor     INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_negocio      INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  id_pais         INT(10) UNSIGNED    NOT NULL DEFAULT 0,
  vc_log          VARCHAR(500)        NOT NULL,
  i_status        TINYINT(4)          NOT NULL DEFAULT 1,
  dt_registro     TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_service   (id_service),
  INDEX idx_usuario   (id_usuario),
  INDEX idx_negocio   (id_negocio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
