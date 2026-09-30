# 📋 Checklist de Historias de Usuario - Sprint 2 (Fabián Vargas)

Este documento contiene la lista de chequeo y el estado de avance de las Historias de Usuario asignadas a Fabián Vargas para el **Sprint 2**.

---

## 🚀 Resumen de Avance

- **Total Historias de Usuario:** 6
- **Completadas:** 6 / 6 (100%)
- **En Progreso:** 0 / 6
- **Pendientes:** 0 / 6

---

## 📌 Lista de Chequeo de Historias de Usuario

### 1. [x] HU-JCC-006: Generación masiva de credenciales digitales
- **Prioridad:** Alta | **Módulo:** Tarjetas (Contadores / Sociedades)
- **Requisitos:** `REQ-FUNC-005`, `REQ-FUNC-009`, `REQ-FUNC-011`
- **Tareas Completadas:**
  - [x] **MFE Admin:** Crear vista "Emisión masiva de credenciales" con carga de archivo CSV.
  - [x] **MFE Admin:** Descarga de plantilla CSV adaptada a Contadores/Sociedades.
  - [x] **MFE Admin:** Desplegar resultados del procesamiento en lote en la misma vista.
  - [x] **MS Python:** Endpoint para lectura y procesamiento en lote de archivo CSV.
  - [x] **MS Python:** Integración con servicio MYJCC para validación de estado de cada registro.
  - [x] **MS Python:** Generar credenciales digitales en estado `Emitida` + Hash/QR único.
  - [x] **MS Python:** Registrar solicitudes y respuestas en auditoría API.

---

### 2. [x] HU-JCC-013: Visualización y exportación de credencial digital CON QR
- **Prioridad:** Media/Alta | **Módulo:** Tarjetas / PDF
- **Requisitos:** `REQ-FUNC-014`, `REQ-FUNC-015`
- **Tareas Completadas:**
  - [x] **MFE Admin:** Acción "Ver tarjeta" en menú *Más acciones* de tablas Contadores/Sociedades.
  - [x] **MFE Admin:** Modal "Tarjeta digital" con datos y diseño según el tipo de titular.
  - [x] **MFE Admin:** Acción y botón "Exportar tarjeta" para descarga PDF en caliente con JS (`jsPDF` + `html2canvas`).
  - [x] **MS Python / BD:** Columna `hash_sha256` en base de datos para contadores y sociedades con cálculo automático.
  - [x] **MFE Admin:** Generación del código QR de autenticidad en el PDF a partir del hash SHA-256 único de la tarjeta.

---

### 3. [x] HU-JCC-018: Parametrización visual y branding de credenciales
- **Prioridad:** Media | **Módulo:** Branding
- **Requisitos:** `REQ-FUNC-021`
- **Tareas Completadas:**
  - [x] **MFE Admin:** Menú Branding con vistas separadas para `Contadores` y `Sociedades`.
  - [x] **MFE Admin:** Formulario con carga de Logo (máx 300 KB), Patrón, Color fondo, Color letra y Fuente.
  - [x] **MFE Admin:** Vista previa en tiempo real de la tarjeta según configuración.
  - [x] **MFE Admin:** Botón "Guardar nueva versión" (sin sobrescribir versiones existentes).
  - [x] **MFE Admin:** Sección "Historial de versiones" y botón "Publicar".
  - [x] **MS Python:** Endpoints CRUD para gestión de versiones de branding e historial.

---

### 4. [x] HU-JCC-019: Configuración de datos visibles en validación QR
- **Prioridad:** Alta | **Módulo:** Validador QR
- **Requisitos:** `REQ-FUNC-022`
- **Tareas Completadas:**
  - [x] **MFE Admin:** Vista "Campos del validador (verificación pública)".
  - [x] **MFE Admin:** Checkboxes de campos visibles (`Fotografía`, `Nombres`, `Matrícula`, `Identificación`, `Código de tarjeta`, `Estado`).
  - [x] **MFE Admin:** Validar que requiera al menos 1 campo seleccionado antes de guardar (Frontend y Backend).
  - [x] **MS Python:** Endpoint para consultar y guardar configuración de visibilidad de campos.

---

### 5. [x] HU-JCC-020: Configuración y envío de notificaciones personalizadas (Sin Firebase)
- **Prioridad:** Baja | **Módulo:** Notificaciones
- **Requisitos:** `REQ-FUNC-023`
- **Tareas Completadas:**
  - [x] **MFE Admin:** Vista "Configuración de Notificaciones" / "Crear notificación".
  - [x] **MFE Admin:** Campos de rango horario, canal (Push/Alerta/Interna), título, mensaje, tipo y audiencia.
  - [x] **MFE Admin:** Opción de envío inmediato o programado (fecha, hora, recurrencia).
  - [x] **MFE Admin:** Tabla de "Historial de notificaciones enviadas".
  - [x] **MS Python:** Endpoints `/notificaciones/list` y `/notificaciones/create` para persistencia e historial en MySQL (`tn_tarjetavirtual_notificaciones`).

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
