import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import {
  AUTH_CLIENT_ID,
  AUTH_LOGIN_REDIRECT_URL,
  AUTH_MODULE,
  AUTH_PERMISSIONS_URL,
  AUTH_SESSION_URL,
} from '../config/api.config';
import {
  ALL_MODULE_PERMISSIONS,
  MANUAL_PERMISSION_CONFIG,
  ORDERED_ROUTE_PERMISSIONS,
  PermissionCode,
  TARJETA_CONTEXT_PERMISSIONS,
  TarjetaGranularAction,
  TarjetaPermissionScope,
} from '../constants/permissions.constants';
import { AppTile, MenuItem, MenuSection, UserProfile } from '../models/layout.models';

export interface SessionUser {
  id: number;
  nombre: string;
  login: string;
  email: string;
  observacion?: string;
  tipo_doc?: string;
  identificacion?: number | string;
  tipo?: number;
  tipo_wf?: number;
  estado?: string;
  tipo_acceso?: string;
  cliente?: number;
  dependencia_id?: number;
  [key: string]: any;
}

export interface SessionModuleInfo {
  link: string;
  img?: string;
  display: string;
  classImage?: string;
}

export interface CoreSessionResponse {
  authenticated: boolean;
  user?: SessionUser;
  modules?: Record<string, SessionModuleInfo>;
  session_info?: {
    uid: number;
    time_over?: number;
    time_session_check?: number;
  };
}

export interface CorePermissionsResponse {
  client_id: number;
  uid: number;
  modulo: string;
  total: number;
  permissions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  private http = inject(HttpClient);

  private readonly _initialized = signal<boolean>(false);
  private readonly _authenticated = signal<boolean>(false);
  private readonly _uid = signal<number | null>(null);
  private readonly _user = signal<SessionUser | null>(null);
  private readonly _modules = signal<Record<string, SessionModuleInfo>>({});
  private readonly _rawPermissions = signal<Set<string>>(new Set<string>());
  private readonly _manualRevoked = signal<Set<string>>(
    new Set<string>(MANUAL_PERMISSION_CONFIG.manuallyRevokedPermissions)
  );
  private readonly _manualGranted = signal<Set<string>>(
    new Set<string>(MANUAL_PERMISSION_CONFIG.manuallyGrantedPermissions)
  );
  private readonly _versionTick = signal<number>(0);

  private initRequest$: Observable<boolean> | null = null;

  /** Señales públicas de solo lectura para vinculación reactiva */
  public readonly initialized = this._initialized.asReadonly();
  public readonly authenticated = this._authenticated.asReadonly();
  public readonly uid = this._uid.asReadonly();
  public readonly user = this._user.asReadonly();
  public readonly modules = this._modules.asReadonly();

  /** Conjunto efectivo de permisos tras aplicar concesiones y revocaciones manuales */
  public readonly effectivePermissions = computed<ReadonlySet<string>>(() => {
    this._versionTick();
    const base = new Set<string>(this._rawPermissions());
    for (const granted of this._manualGranted()) {
      base.add(granted);
    }
    for (const revoked of this._manualRevoked()) {
      base.delete(revoked);
    }
    return base;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).permissionsService = this;
    }
  }

  /**
   * Inicializa la validación de sesión (/apig/core/auth/session) y la carga de permisos
   * granulares (/apig/core/auth/permissions). Si ya se inicializó, retorna el estado actual.
   */
  public ensureInitialized(): Observable<boolean> {
    if (this._initialized()) {
      return of(this._authenticated());
    }

    if (this.initRequest$) {
      return this.initRequest$;
    }

    this.initRequest$ = this.http
      .get<CoreSessionResponse>(AUTH_SESSION_URL, { withCredentials: true })
      .pipe(
        switchMap((sessionRes) => {
          const isAuth = sessionRes?.authenticated === true;
          const uid = sessionRes?.session_info?.uid ?? sessionRes?.user?.id ?? null;

          if (!isAuth || !uid) {
            this.handleUnauthenticated();
            return of(false);
          }

          // Verificar si el diccionario de módulos incluye TarjetasDigitales
          const mods = sessionRes?.modules || {};
          const moduleKeys = Object.keys(mods);
          if (moduleKeys.length > 0) {
            const hasTarjetasMod = moduleKeys.some(
              (k) => k.toLowerCase() === AUTH_MODULE.toLowerCase()
            );
            if (!hasTarjetasMod) {
              console.warn(
                `[PermissionsService] El usuario (uid=${uid}) no tiene habilitado el módulo ${AUTH_MODULE}.`
              );
              this.handleUnauthenticated();
              return of(false);
            }
          }

          this._authenticated.set(true);
          this._uid.set(Number(uid));
          this._user.set(sessionRes.user || null);
          this._modules.set(mods);

          const permsUrl = `${AUTH_PERMISSIONS_URL}?client_id=${AUTH_CLIENT_ID}&uid=${encodeURIComponent(
            String(uid)
          )}&modulo=${encodeURIComponent(AUTH_MODULE)}`;

          return this.http
            .get<CorePermissionsResponse>(permsUrl, { withCredentials: true })
            .pipe(
              map((permRes) => {
                const permsList = Array.isArray(permRes?.permissions) ? permRes.permissions : [];
                this._rawPermissions.set(new Set<string>(permsList));
                this._initialized.set(true);
                return true;
              }),
              catchError((permErr: HttpErrorResponse) => {
                console.error('[PermissionsService] Error al consultar permisos granulares:', permErr);
                if (permErr.status === 401 || permErr.status === 403) {
                  this.handleUnauthenticated();
                  return of(false);
                }
                this._rawPermissions.set(new Set<string>());
                this._initialized.set(true);
                return of(true);
              })
            );
        }),
        catchError((err: HttpErrorResponse) => {
          // En entorno local donde /apig/core aún no está montado (HTTP 404 en local-jcc / localhost),
          // permitir desarrollo local con los permisos del catálogo para no bloquear el entorno.
          if (this.isLocalUnmountedAuthEndpoint(err)) {
            console.info(
              '[PermissionsService] Entorno local sin /apig/core montado: inicializando sesión local de desarrollo.'
            );
            this.activateLocalDevFallback();
            return of(true);
          }

          console.warn('[PermissionsService] Sesión no válida o error en /session:', err);
          this.handleUnauthenticated();
          return of(false);
        }),
        tap(() => {
          this.initRequest$ = null;
        }),
        shareReplay(1)
      );

    return this.initRequest$;
  }

  /**
   * Fuerza la recarga de la sesión y los permisos desde el servidor.
   */
  public refreshPermissions(): Observable<boolean> {
    this._initialized.set(false);
    this.initRequest$ = null;
    return this.ensureInitialized();
  }

  /**
   * Verifica si un permiso puntual está concedido al usuario actual,
   * evaluando también cualquier restricción manual o función custom registrada.
   */
  public hasPermission(permission: PermissionCode | null | undefined): boolean {
    if (!permission) return true;
    const effective = this.effectivePermissions();
    if (!effective.has(permission)) {
      return false;
    }

    const customFn = MANUAL_PERMISSION_CONFIG.customEvaluators[permission];
    if (typeof customFn === 'function') {
      try {
        return customFn({
          permissions: effective,
          uid: this._uid(),
          user: this._user(),
        });
      } catch (e) {
        console.error(`[PermissionsService] Error en evaluador custom para '${permission}':`, e);
        return false;
      }
    }

    return true;
  }

  /**
   * Retorna `true` si el usuario posee AL MENOS UNO de los permisos indicados.
   */
  public hasAnyPermission(permissions: PermissionCode[]): boolean {
    if (!Array.isArray(permissions) || permissions.length === 0) return true;
    return permissions.some((p) => this.hasPermission(p));
  }

  /**
   * Retorna `true` si el usuario posee TODOS los permisos indicados.
   */
  public hasAllPermissions(permissions: PermissionCode[]): boolean {
    if (!Array.isArray(permissions) || permissions.length === 0) return true;
    return permissions.every((p) => this.hasPermission(p));
  }

  /**
   * Obtiene el código de permiso correspondiente a un contexto ('cont' | 'repCont' | 'soc' | 'repSoc')
   * y una acción granular ('listado' | 'detalles' | 'verTarjeta' | 'exportar' | 'regenerar' | 'historial').
   */
  public getContextPermission(
    scope: TarjetaPermissionScope,
    action: TarjetaGranularAction
  ): PermissionCode | null {
    return TARJETA_CONTEXT_PERMISSIONS[scope]?.[action] || null;
  }

  /**
   * Evalúa si el usuario tiene permiso para ejecutar una acción granular dentro de su contexto
   * (Gestión vs Reporte, Contadores vs Sociedades).
   */
  public canInContext(scope: TarjetaPermissionScope, action: TarjetaGranularAction): boolean {
    const code = this.getContextPermission(scope, action);
    if (!code) return false;
    return this.hasPermission(code);
  }

  /**
   * Permite evaluar una función personalizada en cualquier punto del sistema.
   */
  public checkCustomRule(
    ruleFn: (ctx: {
      permissions: ReadonlySet<string>;
      uid: number | null;
      user: SessionUser | null;
    }) => boolean
  ): boolean {
    try {
      return ruleFn({
        permissions: this.effectivePermissions(),
        uid: this._uid(),
        user: this._user(),
      });
    } catch (e) {
      console.error('[PermissionsService] Error al evaluar checkCustomRule:', e);
      return false;
    }
  }

  // ==========================================================================
  // FUNCIONES PARA LIMITACIÓN MANUAL EN TIEMPO DE EJECUCIÓN / FUTURO
  // ==========================================================================

  /**
   * Revoca manualmente uno o varios permisos en el sistema (oculta inmediatamente
   * menús, botones y bloquea rutas asociadas).
   */
  public revokeManually(...permissions: PermissionCode[]): void {
    const updated = new Set<string>(this._manualRevoked());
    permissions.forEach((p) => updated.add(p));
    this._manualRevoked.set(updated);
    this._versionTick.update((v) => v + 1);
  }

  /**
   * Concede manualmente uno o varios permisos.
   */
  public grantManually(...permissions: PermissionCode[]): void {
    const updated = new Set<string>(this._manualGranted());
    const revoked = new Set<string>(this._manualRevoked());
    permissions.forEach((p) => {
      updated.add(p);
      revoked.delete(p);
    });
    this._manualGranted.set(updated);
    this._manualRevoked.set(revoked);
    this._versionTick.update((v) => v + 1);
  }

  /**
   * Reemplaza la lista completa de permisos activos (útil para pruebas o limitaciones manuales).
   */
  public setPermissions(permissions: PermissionCode[]): void {
    this._rawPermissions.set(new Set<string>(permissions));
    this._versionTick.update((v) => v + 1);
  }

  /**
   * Restaura las revocaciones y concesiones manuales a los valores por defecto.
   */
  public clearManualOverrides(): void {
    this._manualRevoked.set(new Set<string>(MANUAL_PERMISSION_CONFIG.manuallyRevokedPermissions));
    this._manualGranted.set(new Set<string>(MANUAL_PERMISSION_CONFIG.manuallyGrantedPermissions));
    this._versionTick.update((v) => v + 1);
  }

  /**
   * Registra una función evaluadora personalizada para un código de permiso específico.
   */
  public registerCustomEvaluator(
    permission: PermissionCode,
    evaluator: (context: { permissions: ReadonlySet<string>; uid: number | null; user: any }) => boolean
  ): void {
    MANUAL_PERMISSION_CONFIG.customEvaluators[permission] = evaluator;
    this._versionTick.update((v) => v + 1);
  }

  // ==========================================================================
  // NAVEGACIÓN, MENÚ Y CABECERA (AGNÓSTICO A wc_admin_layout)
  // ==========================================================================

  /**
   * Retorna la primera ruta interna del MFE a la que el usuario tiene permiso de acceso.
   */
  public getFirstAllowedRoute(): string | null {
    for (const item of ORDERED_ROUTE_PERMISSIONS) {
      if (this.hasPermission(item.permission)) {
        return item.path;
      }
    }
    return null;
  }

  /**
   * Filtra el árbol de secciones del menú lateral ocultando (eliminando del array)
   * cualquier opción sin permiso y cualquier grupo padre que quede sin hijos.
   */
  public filterMenuSections(masterSections: MenuSection[]): MenuSection[] {
    const authorizedSections: MenuSection[] = [];

    for (const section of masterSections) {
      const filteredItems: MenuItem[] = [];

      for (const item of section.items) {
        if (item.children && item.children.length > 0) {
          const allowedChildren = item.children.filter((child) =>
            this.isMenuItemAllowed(child)
          );
          if (allowedChildren.length > 0) {
            filteredItems.push({
              ...item,
              children: allowedChildren,
            });
          }
        } else if (this.isMenuItemAllowed(item)) {
          filteredItems.push({ ...item });
        }
      }

      if (filteredItems.length > 0) {
        authorizedSections.push({
          ...section,
          items: filteredItems,
        });
      }
    }

    return authorizedSections;
  }

  private isMenuItemAllowed(item: MenuItem): boolean {
    if (item.permission) {
      return this.hasPermission(item.permission);
    }
    if (item.permissions && item.permissions.length > 0) {
      return this.hasAnyPermission(item.permissions);
    }
    return true;
  }

  /**
   * Construye el perfil de usuario para <nx-admin-header> a partir de la sesión activa.
   */
  public buildUserProfile(fallback: UserProfile): UserProfile {
    const u = this._user();
    if (!u || !u.nombre) return fallback;

    const parts = u.nombre.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : u.nombre.substring(0, 2).toUpperCase();

    return {
      name: u.nombre,
      email: u.email || fallback.email,
      role: u.tipo_acceso === 'cms' ? 'Administrador' : fallback.role,
      initials,
    };
  }

  /**
   * Construye la cuadrícula de módulos autorizados para <nx-admin-header> a partir de `session.modules`.
   */
  public buildAppGrid(fallback: AppTile[]): AppTile[] {
    const mods = this._modules();
    const keys = Object.keys(mods);
    if (keys.length === 0) return fallback;

    const iconMap: Record<string, { icon: string; color: string }> = {
      administracion: { icon: 'fa fa-cogs', color: 'blue' },
      bloques: { icon: 'fa fa-cubes', color: 'purple' },
      tarjetasdigitales: { icon: 'fa fa-id-card', color: 'teal' },
      usuarios: { icon: 'fa fa-users', color: 'indigo' },
    };

    return keys.map((key) => {
      const item = mods[key];
      const normKey = key.toLowerCase();
      const meta = iconMap[normKey] || { icon: 'fa fa-th-large', color: 'blue' };
      return {
        id: key,
        name: item.display || key,
        color: meta.color,
        iconClass: meta.icon,
        path: item.link || '/admin',
        active: normKey === AUTH_MODULE.toLowerCase(),
      };
    });
  }

  /**
   * Redirige a `/admin` cuando el usuario no tiene sesión autenticada.
   */
  public redirectToAdminLogin(): void {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname || '';
    if (currentPath.includes('/verificar')) {
      return;
    }
    window.location.href = AUTH_LOGIN_REDIRECT_URL;
  }

  private handleUnauthenticated(): void {
    this._authenticated.set(false);
    this._uid.set(null);
    this._user.set(null);
    this._rawPermissions.set(new Set<string>());
    this._initialized.set(true);
    this.redirectToAdminLogin();
  }

  private isLocalUnmountedAuthEndpoint(err: HttpErrorResponse): boolean {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname || '';
    const isLocalHost =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('local-');
    return isLocalHost && (err.status === 404 || err.status === 0 || err.status === 502);
  }

  private activateLocalDevFallback(): void {
    this._authenticated.set(true);
    this._uid.set(111);
    this._user.set({
      id: 111,
      nombre: 'Fabian Vargas',
      login: 'fvargas',
      email: 'fvargas@nexura.com',
      tipo_acceso: 'cms',
    });
    this._rawPermissions.set(new Set<string>(ALL_MODULE_PERMISSIONS));
    this._initialized.set(true);
  }
}
