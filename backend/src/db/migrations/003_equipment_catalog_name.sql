-- Migración 003: Añadir catalog_name a equipment
-- Permite vincular equipo personalizado a un item del catálogo para matching de ejercicios

ALTER TABLE equipment ADD COLUMN catalog_name VARCHAR(100) DEFAULT NULL AFTER name;

-- Para el equipo existente que vino del catálogo, rellenar catalog_name con el name actual
UPDATE equipment e
  JOIN equipment_catalog ec ON ec.name = e.name
  SET e.catalog_name = e.name;
