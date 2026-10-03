# Guía Oficial de Uso: Orquestador Universal Azure DevOps PR Pipeline
> **Archivo ejecutable:** `E:\laragon\nx\angular\azure_pr_pipeline.bat`  
> **Motor PowerShell:** `E:\laragon\nx\angular\azure_pipeline.ps1`

---

## 1. Filosofía y Propósito

Este orquestador fue diseñado para eliminar la fricción operativa y el error humano en el flujo de trabajo de Git y Azure DevOps. **No requiere instalar extensiones raras, ni configurar git hooks manuales, ni ejecutar comandos externos dispersos.**

Con **un solo comando por consola**, el orquestador se encarga de todo el ciclo de entrega continua hacia preproducción:
1. Extrae tus cambios y crea automáticamente una rama `feature/<nombre-del-ajuste>`.
2. Genera un commit descriptivo de tamaño mediano (ideal para trazabilidad e historial con IA).
3. Realiza el push a Azure DevOps y valida con `git ls-remote` que la rama llegó intacta.
4. Crea y fusiona el **PR 1 (`feature -> dev`)**, **eliminando la rama remota de feature** (tal como la casilla de Azure *"Delete branch after merging"*).
5. Crea y fusiona el **PR 2 (`dev -> qa`)** conservando las ramas base.
6. Crea y fusiona el **PR 3 (`qa -> master`)** dejando el código integrado en preproducción.
7. Realiza un saneamiento local completo: te regresa a la rama `dev`, descarga los cambios fusionados (`git pull origin dev`), elimina la rama local temporal y limpia referencias (`prune`).

---

## 2. El Comando Maestro (Deploy en 1 Solo Paso)

Para realizar todo el despliegue automático desde cualquier consola (PowerShell o CMD):

```powershell
cmd /c "E:\laragon\nx\angular\azure_pr_pipeline.bat -Repo <alias> -Action deploy -Branch <nombre-ajuste> -Message '<mensaje_descriptivo_mediano>'"
```

### Ejemplos Reales:

#### Microfrontend Admin (`mfe_tardigitales_admin`):
```powershell
cmd /c "E:\laragon\nx\angular\azure_pr_pipeline.bat -Repo admin -Action deploy -Branch diseno-tarjeta -Message 'feat(tarjetas): optimizar diseno credencial responsive y servicio pdf'"
```

#### Microservicio Python (`ms_tardigitales_admin`):
```powershell
cmd /c "E:\laragon\nx\angular\azure_pr_pipeline.bat -Repo ms -Action deploy -Branch branding-schema -Message 'feat(branding): alinear esquema de configuracion branding y depurar campo fuente'"
```

#### Microfrontend Reportes (`mfe_tardigitales_reportes`):
```powershell
cmd /c "E:\laragon\nx\angular\azure_pr_pipeline.bat -Repo reportes -Action deploy -Branch filtros-reporte -Message 'feat(reportes): agregar filtros avanzados por fecha de emision'"
```

#### Web Components Layout (`wc_admin_layout`):
```powershell
cmd /c "E:\laragon\nx\angular\azure_pr_pipeline.bat -Repo layout -Action deploy -Branch header-avatar -Message 'feat(layout): ajustar espaciado del menu superior y avatar'"
```

---

## 3. Parámetros Disponibles

| Parámetro | Requerido | Descripción | Ejemplo |
|---|---|---|---|
| `-Repo` | Sí | Nombre o alias del repositorio (`admin`, `ms`, `reportes`, `layout`). | `-Repo admin` |
| `-Action` | Sí | Acción a ejecutar: `deploy`, `push`, `status`, `pr`. | `-Action deploy` |
| `-Branch` | Opcional | Nombre de la nueva rama feature. Si se omite, se autogenera a partir del mensaje. | `-Branch diseno-tarjeta` |
| `-Message` | Sí | Mensaje del commit y título base de los Pull Requests. | `-Message 'feat(mod): descripcion...'` |
| `-Token` | Opcional | Token PAT de Azure DevOps (ya cuenta con token predeterminado). | `-Token "tu_token"` |

> 💡 **Generación Automática de Rama (`-Branch` Opcional):**  
> Si ejecutas el comando omitiendo `-Branch`, el script creará automáticamente una rama única limpia basada en el slug del mensaje: `feature/<slug-del-mensaje>` (ej. `feature/optimizar-diseno-credencial-responsive`).

---

## 4. Otras Acciones Rápidas

### A. Solo Commit y Push a rama Feature (Sin hacer Pull Requests)
Ideal cuando estás trabajando a medias y solo quieres respaldar tu trabajo en Azure sin pasarlo a Dev/QA/Master:
```powershell
cmd /c "E:\laragon\nx\angular\azure_pr_pipeline.bat -Repo admin -Action push -Branch mi-rama -Message 'feat(modulo): avance preliminar de estilos'"
```

### B. Consultar el estado de Git de un repositorio
Muestra la rama actual, cambios pendientes y metadatos de Azure DevOps:
```powershell
cmd /c "E:\laragon\nx\angular\azure_pr_pipeline.bat -Repo admin -Action status"
```

### C. Modo Menú Interactivo Visual
Si ejecutas el comando sin parámetros, se abrirá un menú interactivo en terminal para seleccionar repositorios y acciones con un clic de teclado:
```powershell
cmd /c "E:\laragon\nx\angular\azure_pr_pipeline.bat"
```

---

## 5. Salvaguardas y Protecciones Automáticas

1. **¿Qué pasa si estás programando en `dev`?**  
   El script detecta tus archivos modificados y ejecuta un `git checkout -b feature/<nueva-rama>`, trasladando todos tus cambios sin commitear a la rama nueva sin perder una sola línea. Al terminar el deploy, te regresa a `dev` 100% actualizado.
2. **¿Qué pasa si estás en `qa` o `master` con cambios?**  
   Aplica protección inteligente *Stash & Rebase*: guarda los cambios con `git stash`, se pasa a `dev`, descarga la versión más reciente (`git pull origin dev`), crea la nueva feature desde allí y restaura tus cambios con `git stash pop`.
3. **¿Qué pasa si el `git push` falla?**  
   Si hay problemas de red, rechazo remoto o credenciales inválidas, el script **aborta inmediatamente** y no intenta crear ningún Pull Request inválido.
4. **¿Qué pasa si dos ramas ya están idénticas (0 cambios)?**  
   Antes de llamar a Azure DevOps, el script compara el delta de commits (`git log Target..Source`). Si `dev` y `qa` (o `qa` y `master`) ya están iguales, **omite el PR limpiamente sin arrojar error**.
5. **Detección de Conflictos de Fusión:**  
   Si Azure DevOps detecta conflictos entre ramas, el script detiene la fusión automática, te muestra la advertencia y te entrega el enlace web directo al PR para resolución manual sin forzar merges rotos.
6. **Formato Uniforme de Pull Requests:**  
   Los 3 PRs en Azure DevOps se titulan automáticamente:
   - `[Mensaje] (feature/...->dev)` *(con eliminación de rama remota)*
   - `[Mensaje] (dev->qa)` *(sin eliminación)*
   - `[Mensaje] (qa->master)` *(sin eliminación)*

---

## 6. Autenticación Azure CLI (Requisito Único)

La máquina debe contar con sesión activa en Azure CLI. Si es la primera vez que se usa la máquina, solo se ejecuta una vez en la terminal:
```powershell
az login
```
El script ya integra un token PAT de contingencia y verifica la sesión automáticamente al inicio de cada ejecución.
