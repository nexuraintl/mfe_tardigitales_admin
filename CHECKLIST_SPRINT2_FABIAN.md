# 📋 Checklist de Historias de Usuario - Sprint 2 (Fabián Vargas)

Este documento contiene la lista de chequeo y el estado de avance de las Historias de Usuario asignadas a Fabián Vargas para el **Sprint 2**.

---

## 🚀 Resumen de Avance

- **Total Historias de Usuario:** 6
- **Completadas:** 1 / 6
- **En Progreso:** 0 / 6
- **Pendientes:** 5 / 6

---

## 📌 Lista de Chequeo de Historias de Usuario

### 1. [ ] HU-JCC-006: Generación masiva de credenciales digitales
- **Prioridad:** Alta | **Módulo:** Tarjetas (Contadores / Sociedades)
- **Requisitos:** `REQ-FUNC-005`, `REQ-FUNC-009`, `REQ-FUNC-011`
- **Tareas Pendientes:**
  - [ ] **MFE Admin:** Crear vista "Emisión masiva de credenciales" con carga de archivo CSV.
  - [ ] **MFE Admin:** Descarga de plantilla CSV adaptada a Contadores/Sociedades.
  - [ ] **MFE Admin:** Desplegar resultados del procesamiento en lote en la misma vista.
  - [ ] **MS Python:** Endpoint para lectura y procesamiento en lote de archivo CSV.
  - [ ] **MS Python:** Integración con servicio MYJCC para validación de estado de cada registro.
  - [ ] **MS Python:** Generar credenciales digitales en estado `Emitida` + Hash/QR único.
  - [ ] **MS Python:** Registrar solicitudes y respuestas en auditoría API.

---

### 2. [ ] HU-JCC-013: Visualización y exportación de credencial digital CON QR
- **Prioridad:** Media/Alta | **Módulo:** Tarjetas / PDF
- **Requisitos:** `REQ-FUNC-014`, `REQ-FUNC-015`
- **Tareas Pendientes:**
  - [ ] **MFE Admin:** Acción "Ver tarjeta" en menú *Más acciones* de tablas Contadores/Sociedades.
  - [ ] **MFE Admin:** Modal "Tarjeta digital" con datos y diseño según el tipo de titular.
  - [ ] **MFE Admin:** Acción y botón "Exportar tarjeta" para descarga PDF.
  - [ ] **MS Python:** Endpoint para generación y descarga de tarjeta en formato PDF/A.
  - [ ] **MS Python:** Incluir código QR estático de validación pública en el PDF/A.

---

### 3. [ ] HU-JCC-018: Parametrización visual y branding de credenciales
- **Prioridad:** Media | **Módulo:** Branding
- **Requisitos:** `REQ-FUNC-021`
- **Tareas Pendientes:**
  - [ ] **MFE Admin:** Menú Branding con vistas separadas para `Contadores` y `Sociedades`.
  - [ ] **MFE Admin:** Formulario con carga de Logo (máx 300 KB), Patrón, Color fondo, Color letra y Fuente.
  - [ ] **MFE Admin:** Vista previa en tiempo real de la tarjeta según configuración.
  - [ ] **MFE Admin:** Botón "Guardar nueva versión" (sin sobrescribir versiones existentes).
  - [ ] **MFE Admin:** Sección "Historial de versiones" y botón "Publicar".
  - [ ] **MS Python:** Endpoints CRUD para gestión de versiones de branding e historial.

---

### 4. [ ] HU-JCC-019: Configuración de datos visibles en validación QR
- **Prioridad:** Alta | **Módulo:** Validador QR
- **Requisitos:** `REQ-FUNC-022`
- **Tareas Pendientes:**
  - [ ] **MFE Admin:** Vista "Campos del validador (verificación pública)".
  - [ ] **MFE Admin:** Checkboxes de campos visibles (`Fotografía`, `Nombres`, `Matrícula`, `Identificación`, `Código de tarjeta`, `Estado`).
  - [ ] **MFE Admin:** Validar que requiera al menos 1 campo seleccionado antes de guardar.
  - [ ] **MS Python:** Endpoint para consultar y guardar configuración de visibilidad de campos.

---

### 5. [ ] HU-JCC-020: Configuración y envío de notificaciones personalizadas (Sin Firebase)
- **Prioridad:** Baja | **Módulo:** Notificaciones
- **Requisitos:** `REQ-FUNC-023`
- **Tareas Pendientes:**
  - [ ] **MFE Admin:** Vista "Configuración de Notificaciones" / "Crear notificación".
  - [ ] **MFE Admin:** Campos de rango horario, canal (Push/Alerta/Interna), título, mensaje, tipo y audiencia.
  - [ ] **MFE Admin:** Opción de envío inmediato o programado (fecha, hora, recurrencia).
  - [ ] **MFE Admin:** Tabla de "Historial de notificaciones enviadas".
  - [ ] **MS Python:** Endpoints para guardar/programar notificaciones e historial.

---

### 6. [x] HU-JCC-022: Consulta de auditoría de eventos y transacciones
- **Prioridad:** Baja | **Módulo:** Auditoría API
- **Requisitos:** `REQ-FUNC-025`
- **Tareas Completadas:**
  - [x] **MFE Admin:** Vista "Auditoría de llamados a la API" refactorizada sin parches informales.
  - [x] **MFE Admin:** Renderizar la URL/Endpoint completo real del consumo consumido a MYJCC/JCC con tooltip y truncado elegante.
  - [x] **MFE Admin:** Filtros por fecha (Desde/Hasta), búsqueda por texto, endpoint, tipo, estado y registros por página.
  - [x] **MFE Admin:** Modal de detalle de petición/respuesta con enmascaramiento automático de credenciales/tokens de autorización (`Authorization`, `token`, `bearer`).
  - [x] **MS Python:** Consulta SQL refactorizada en `tarjetas_repository.py` retornando `tapi.url AS endpoint` y filtros limpios.

---

## 🔄 Historial de Actualizaciones
* **2026-09-20:** Creación inicial del archivo de checklist del Sprint 2.
