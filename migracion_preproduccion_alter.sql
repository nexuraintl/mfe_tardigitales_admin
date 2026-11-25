-- =============================================================================
-- MIGRACIÓN / ACTUALIZACIÓN ESTRUCTURAL PARA PREPRODUCCIÓN
-- Microfrontend & Microservicio Tarjetas Digitales JCC
-- Compatible con MySQL 5.7+ / MariaDB 10.3+
-- No destructivo: NO elimina tablas, NO borra columnas ni datos existentes.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. TABLA NUEVA: tn_tarjetavirtual_dispositivos (HU-JCC-013 / HU-JCC-014 / HU-JCC-023)
-- Gestión de dispositivos móviles autorizados, tokens FCM y cierre remoto.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tn_tarjetavirtual_dispositivos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL DEFAULT 20001,
  `tarjeta_id` int(11) NOT NULL,
  `tipo_tarjeta` enum('contadores','sociedades') NOT NULL DEFAULT 'contadores',
  `fcm_token` varchar(500) DEFAULT NULL COMMENT 'Token de registro Firebase Cloud Messaging para notificaciones push',
  `device_id` varchar(150) DEFAULT NULL COMMENT 'UUID o identificador de hardware del dispositivo móvil',
  `device_os` varchar(50) DEFAULT NULL COMMENT 'Sistema operativo: android, ios, etc.',
  `device_modelo` varchar(100) DEFAULT NULL COMMENT 'Modelo del dispositivo físico',
  `app_version` varchar(50) DEFAULT NULL COMMENT 'Versión instalada de la aplicación móvil',
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `fecha_activacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_ultimo_acceso` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_disp_tarjeta` (`client_id`, `tarjeta_id`, `tipo_tarjeta`),
  KEY `idx_disp_device` (`device_id`),
  KEY `idx_disp_fcm` (`fcm_token`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Dispositivos móviles autorizados con tokens FCM';

-- -----------------------------------------------------------------------------
-- 2. TABLA: tn_tarjetavirtual_contadores
-- Agregar columnas para vinculación de dispositivo móvil y token FCM.
-- -----------------------------------------------------------------------------
SET @dbname = DATABASE();

-- fcm_token
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_contadores' AND COLUMN_NAME = 'fcm_token');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_contadores` ADD COLUMN `fcm_token` varchar(500) DEFAULT NULL AFTER `hash_sha256`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- device_id
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_contadores' AND COLUMN_NAME = 'device_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_contadores` ADD COLUMN `device_id` varchar(120) DEFAULT NULL AFTER `fcm_token`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- device_os
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_contadores' AND COLUMN_NAME = 'device_os');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_contadores` ADD COLUMN `device_os` varchar(30) DEFAULT NULL AFTER `device_id`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fecha_activacion
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_contadores' AND COLUMN_NAME = 'fecha_activacion');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_contadores` ADD COLUMN `fecha_activacion` datetime DEFAULT NULL AFTER `device_os`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 3. TABLA: tn_tarjetavirtual_sociedades
-- Agregar columnas para vinculación de dispositivo móvil y token FCM.
-- -----------------------------------------------------------------------------

-- fcm_token
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_sociedades' AND COLUMN_NAME = 'fcm_token');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_sociedades` ADD COLUMN `fcm_token` varchar(500) DEFAULT NULL AFTER `hash_sha256`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- device_id
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_sociedades' AND COLUMN_NAME = 'device_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_sociedades` ADD COLUMN `device_id` varchar(120) DEFAULT NULL AFTER `fcm_token`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- device_os
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_sociedades' AND COLUMN_NAME = 'device_os');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_sociedades` ADD COLUMN `device_os` varchar(30) DEFAULT NULL AFTER `device_id`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fecha_activacion
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_sociedades' AND COLUMN_NAME = 'fecha_activacion');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_sociedades` ADD COLUMN `fecha_activacion` datetime DEFAULT NULL AFTER `device_os`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 4. TABLA: tn_tarjetavirtual_config_validador (HU-JCC-014 Validador QR Oficial)
-- Campos canónicos para visualización selectiva en QR de Contadores y Sociedades.
-- -----------------------------------------------------------------------------

-- tipo_tarjeta
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND COLUMN_NAME = 'tipo_tarjeta');
SET @sql = IF(@col_exists = 0, "ALTER TABLE `tn_tarjetavirtual_config_validador` ADD COLUMN `tipo_tarjeta` varchar(20) NOT NULL DEFAULT 'contadores' AFTER `client_id`", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- val_tarjeta_profesional
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND COLUMN_NAME = 'val_tarjeta_profesional');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` ADD COLUMN `val_tarjeta_profesional` tinyint(1) NOT NULL DEFAULT 1 AFTER `fecha_actualizacion`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- val_fecha_resolucion
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND COLUMN_NAME = 'val_fecha_resolucion');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` ADD COLUMN `val_fecha_resolucion` tinyint(1) NOT NULL DEFAULT 1 AFTER `val_tarjeta_profesional`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- val_resolucion
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND COLUMN_NAME = 'val_resolucion');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` ADD COLUMN `val_resolucion` tinyint(1) NOT NULL DEFAULT 1 AFTER `val_fecha_resolucion`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- val_nombre
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND COLUMN_NAME = 'val_nombre');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` ADD COLUMN `val_nombre` tinyint(1) NOT NULL DEFAULT 1 AFTER `val_resolucion`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- val_cedula
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND COLUMN_NAME = 'val_cedula');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` ADD COLUMN `val_cedula` tinyint(1) NOT NULL DEFAULT 1 AFTER `val_nombre`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- val_institucion
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND COLUMN_NAME = 'val_institucion');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` ADD COLUMN `val_institucion` tinyint(1) NOT NULL DEFAULT 1 AFTER `val_cedula`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- val_expediente
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND COLUMN_NAME = 'val_expediente');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` ADD COLUMN `val_expediente` tinyint(1) NOT NULL DEFAULT 1 AFTER `val_institucion`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- val_numero_registro
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND COLUMN_NAME = 'val_numero_registro');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` ADD COLUMN `val_numero_registro` tinyint(1) NOT NULL DEFAULT 1 AFTER `val_expediente`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- val_razon_social
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND COLUMN_NAME = 'val_razon_social');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` ADD COLUMN `val_razon_social` tinyint(1) NOT NULL DEFAULT 1 AFTER `val_numero_registro`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- val_nit
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND COLUMN_NAME = 'val_nit');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` ADD COLUMN `val_nit` tinyint(1) NOT NULL DEFAULT 1 AFTER `val_razon_social`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- val_tipo_registro
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND COLUMN_NAME = 'val_tipo_registro');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` ADD COLUMN `val_tipo_registro` tinyint(1) NOT NULL DEFAULT 1 AFTER `val_nit`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Actualizar índice único de validador: de uk_validador_client_id a uk_validador_client_tipo
SET @idx_old_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND INDEX_NAME = 'uk_validador_client_id');
SET @sql = IF(@idx_old_exists > 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` DROP INDEX `uk_validador_client_id`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_new_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tn_tarjetavirtual_config_validador' AND INDEX_NAME = 'uk_validador_client_tipo');
SET @sql = IF(@idx_new_exists = 0, 'ALTER TABLE `tn_tarjetavirtual_config_validador` ADD UNIQUE KEY `uk_validador_client_tipo` (`client_id`, `tipo_tarjeta`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 5. SEMILLAS DE CONFIGURACIÓN INICIAL (INSERT IGNORE / ON DUPLICATE)
-- -----------------------------------------------------------------------------

-- Configuración de Colas (client_id = 20001)
INSERT INTO `tn_tarjetavirtual_config_colas`
  (`id`, `client_id`, `worker_enabled`, `poll_interval_seconds`, `batch_size`, `item_delay_seconds`, `circuit_breaker_fail_threshold`, `circuit_breaker_cooldown_seconds`, `max_retries_per_item`, `scheduler_enabled`, `scheduler_interval_seconds`, `scheduler_auto_enqueue`, `updated_at`)
VALUES
  (1, 20001, 1, 5.00, 10, 0.050, 3, 60, 2, 1, 3600, 1, NOW())
ON DUPLICATE KEY UPDATE
  `client_id` = VALUES(`client_id`);

-- Configuración de Validador QR para Contadores y Sociedades
INSERT INTO `tn_tarjetavirtual_config_validador`
  (`client_id`, `tipo_tarjeta`, `val_foto`, `val_nombres`, `val_matricula`, `val_numero_identificacion`, `val_codigo_tarjeta`, `val_estado`, `val_tarjeta_profesional`, `val_fecha_resolucion`, `val_resolucion`, `val_nombre`, `val_cedula`, `val_institucion`, `val_expediente`, `val_numero_registro`, `val_razon_social`, `val_nit`, `val_tipo_registro`)
VALUES
  (20001, 'contadores', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
  (20001, 'sociedades', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE
  `val_estado` = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- FIN DE LA MIGRACIÓN
-- =============================================================================
