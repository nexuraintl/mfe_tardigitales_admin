import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, AfterViewInit, inject, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { MenuSection, UserProfile, AppTile, PrimaryAction } from './core/models/layout.models';
import { PermissionsService } from './core/services/permissions.service';
import { PERMISSIONS } from './core/constants/permissions.constants';

export interface HeaderAction {
  id: string;
  label: string;
  icon?: string;
  tooltip?: string;
  forceTooltip?: boolean;
  btnClass?: string;
  action?: () => void;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class App implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  public permissionsService = inject(PermissionsService);

  currentUrl = (typeof window !== 'undefined' && window.location.pathname) ? window.location.pathname : '';
  pageTitle = 'Tarjeta digital para contadores';
  activeComponent: any = null;
  viewActions: HeaderAction[] = [];
  sidebarCollapsed = false;

  private routeTitles: { [key: string]: string } = {
    '/tarjetas-contadores/historial': 'Historial de la tarjeta',
    '/tarjetas-contadores/nueva': 'Emitir tarjeta de contador',
    '/tarjetas-contadores/emision-masiva': 'Emisión masiva de credenciales',
    '/tarjetas-contadores': 'Tarjeta digital para contadores',
    '/tarjetas-sociedades/historial': 'Historial de la sociedad',
    '/tarjetas-sociedades/nueva': 'Emitir tarjeta de sociedad',
    '/tarjetas-sociedades/emision-masiva': 'Emisión masiva de sociedades',
    '/tarjetas-sociedades': 'Tarjeta digital para sociedades',
    '/sociedades/historial': 'Historial de la sociedad',
    '/sociedades/nueva': 'Emitir tarjeta de sociedad',
    '/sociedades/emision-masiva': 'Emisión masiva de sociedades',
    '/sociedades': 'Tarjeta digital para sociedades',
    '/historial': 'Historial de notificaciones',
    '/crear-notificacion': 'Nueva notificación',
    '/crud': 'Gestión de trámites',
    '/validador-qr': 'Campos del validador QR',
    '/validador-qr-contadores': 'Validador QR — Contadores',
    '/validador-qr-sociedades': 'Validador QR — Sociedades',
    '/certificados': 'Certificados oficiales',
    '/reportes/contadores': 'Reporte contadores',
    '/reportes/sociedades': 'Reporte sociedades',
    '/reportes/notificaciones': 'Reporte notificaciones',
    '/reportes/dashboard': 'Reporte dashboard',
    '/reportes': 'Reporte dashboard',
    '/branding': 'Branding de credenciales',
    '/branding-contadores': 'Branding de credenciales — Contadores',
    '/branding-sociedades': 'Branding de credenciales — Sociedades',
    '/branding-institucional': 'Branding — Firma institucional',
    '/auditoria': 'Auditoría API',
    '/procesos-lotes': 'Gestión de colas y procesos en lote',
    '/usuarios': 'Usuarios',
    '/sin-permisos': 'Acceso restringido',
    '/verificar': 'Verificación pública de tarjeta'
  };

  get isPublicRoute(): boolean {
    const rawPath = (typeof window !== 'undefined' && window.location.pathname) ? window.location.pathname : this.router.url;
    const cleanUrl = (rawPath || '').split('?')[0].split('#')[0];
    return cleanUrl.includes('verificar');
  }

  private readonly defaultUser: UserProfile = {
    name: 'Usuario',
    email: '',
    role: 'Administrador',
    initials: 'US'
  };

  currentUser: UserProfile = { ...this.defaultUser };

  // Acción principal destacada sobre el sidebar (configurable y opcional por vista)
  primaryAction: PrimaryAction | null = null;

  private readonly defaultAppGrid: AppTile[] = [
    {
      id: 'admin',
      name: 'Panel de administración',
      color: 'blue',
      iconClass: 'fa fa-th',
      path: '/admin',
      active: true
    }
  ];

  appGrid: AppTile[] = [...this.defaultAppGrid];

  /**
   * Catálogo maestro de opciones del menú lateral con su permiso granular asociado.
   * `wc_admin_layout` permanece 100% agnóstico: `menuSections` solo recibe las opciones autorizadas.
   */
  private readonly masterMenuSections: MenuSection[] = [
    {
      sectionTitle: 'Gestión principal',
      items: [
        {
          id: 'grupo-tarjetas',
          label: 'Tarjetas',
          icon: 'fa fa-id-card',
          children: [
            {
              label: 'Tarjetas contadores',
              icon: 'fa fa-user',
              path: '/tarjetas-contadores',
              permission: PERMISSIONS.CONT_LISTADO
            },
            {
              label: 'Tarjetas sociedades',
              icon: 'fa fa-building-o',
              path: '/tarjetas-sociedades',
              permission: PERMISSIONS.SOC_LISTADO
            }
          ]
        },
        {
          id: 'grupo-notificaciones',
          label: 'Notificaciones',
          icon: 'fa fa-bell',
          children: [
            {
              label: 'Nueva notificación',
              icon: 'fa fa-paper-plane',
              path: '/crear-notificacion',
              permission: PERMISSIONS.NOTIF_NUEVA
            },
            {
              label: 'Historial de notificaciones',
              icon: 'fa fa-history',
              path: '/historial',
              permission: PERMISSIONS.NOTIF_HISTORIAL
            }
          ]
        }
      ]
    },
    {
      sectionTitle: 'Administración',
      items: [
        {
          id: 'grupo-reportes',
          label: 'Reportes',
          icon: 'fa fa-bar-chart',
          children: [
            {
              label: 'Dashboard general',
              icon: 'fa fa-pie-chart',
              path: '/reportes/dashboard',
              permission: PERMISSIONS.REP_DASHBOARD_GEN
            },
            {
              label: 'Reporte contadores',
              icon: 'fa fa-user',
              path: '/reportes/contadores',
              permission: PERMISSIONS.REP_CONT_LISTADO_CSV
            },
            {
              label: 'Reporte sociedades',
              icon: 'fa fa-building-o',
              path: '/reportes/sociedades',
              permission: PERMISSIONS.REP_SOC_LISTADO_CSV
            },
            {
              label: 'Reporte notificaciones',
              icon: 'fa fa-bell',
              path: '/reportes/notificaciones',
              permission: PERMISSIONS.REP_NOTIFICACIONES
            }
          ]
        },
        {
          label: 'Certificados',
          icon: 'fa fa-certificate',
          path: '/certificados',
          permission: PERMISSIONS.CERT_LISTADO
        },
        {
          id: 'grupo-branding',
          label: 'Branding',
          icon: 'fa fa-paint-brush',
          children: [
            {
              label: 'Contadores',
              icon: 'fa fa-user',
              path: '/branding-contadores',
              permission: PERMISSIONS.BRAND_CONT_VER
            },
            {
              label: 'Sociedades',
              icon: 'fa fa-building-o',
              path: '/branding-sociedades',
              permission: PERMISSIONS.BRAND_SOC_VER
            },
            {
              label: 'Firma institucional',
              icon: 'fa fa-pencil-square-o',
              path: '/branding-institucional',
              permission: PERMISSIONS.BRAND_FIRMA_VER
            }
          ]
        },
        {
          id: 'grupo-validador-qr',
          label: 'Validador QR',
          icon: 'fa fa-qrcode',
          children: [
            {
              label: 'Contadores',
              icon: 'fa fa-user',
              path: '/validador-qr-contadores',
              permission: PERMISSIONS.VAL_QR_CONTADORES
            },
            {
              label: 'Sociedades',
              icon: 'fa fa-building-o',
              path: '/validador-qr-sociedades',
              permission: PERMISSIONS.VAL_QR_SOCIEDADES
            }
          ]
        },
        {
          label: 'Auditoría API',
          icon: 'fa fa-shield',
          path: '/auditoria',
          permission: PERMISSIONS.AUDITORIA_API_REG
        }
      ]
    }
  ];

  menuSections: MenuSection[] = [];

  constructor() {
    effect(() => {
      // Reaccionar automáticamente ante cambios de sesión o permisos (incluyendo revocaciones manuales)
      this.permissionsService.effectivePermissions();
      this.permissionsService.user();
      this.permissionsService.modules();

      this.currentUser = this.permissionsService.buildUserProfile(this.defaultUser);
      this.appGrid = this.permissionsService.buildAppGrid(this.defaultAppGrid);
      this.menuSections = this.permissionsService.filterMenuSections(this.masterMenuSections);
      this.updateViewActions(this.currentUrl);
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 992) {
      this.sidebarCollapsed = true;
    }
    this.currentUrl = (typeof window !== 'undefined' && window.location.pathname) ? window.location.pathname : this.router.url;

    if (!this.isPublicRoute) {
      this.permissionsService.ensureInitialized().subscribe();
    }

    this.updatePageTitle(this.currentUrl);
    this.updateViewActions(this.currentUrl);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects || window.location.pathname;
        this.updatePageTitle(this.currentUrl);
        this.updateViewActions(this.currentUrl);
        this.cdr.detectChanges();
      });
  }

  ngAfterViewInit(): void {
    this.hideHeaderSearch();
  }

  private hideHeaderSearch(): void {
    if (typeof window === 'undefined') return;

    const applyHide = () => {
      const headerEl = document.querySelector('nx-admin-header');
      if (headerEl?.shadowRoot) {
        if (!headerEl.shadowRoot.getElementById('nx-hide-search-style')) {
          const style = document.createElement('style');
          style.id = 'nx-hide-search-style';
          style.textContent = '.nx-search-container { display: none !important; }';
          headerEl.shadowRoot.appendChild(style);
        }
      }
    };

    applyHide();
    if (typeof customElements !== 'undefined') {
      customElements.whenDefined('nx-admin-header').then(() => {
        applyHide();
        setTimeout(applyHide, 100);
        setTimeout(applyHide, 500);
      });
    }
  }

  onRouteActivate(componentInstance: any): void {
    this.activeComponent = componentInstance;
    this.currentUrl = (typeof window !== 'undefined' && window.location.pathname) ? window.location.pathname : this.router.url;
    this.updatePageTitle(this.currentUrl);
    this.updateViewActions(this.currentUrl);
    this.cdr.detectChanges();
  }

  private updatePageTitle(url: string) {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const sortedRoutes = Object.keys(this.routeTitles).sort((a, b) => b.length - a.length);
    const match = sortedRoutes.find(route => cleanUrl.endsWith(route) || cleanUrl.includes(route));
    if (match) {
      this.pageTitle = this.routeTitles[match];
    }
  }

  private updateViewActions(url: string) {
    const cleanUrl = url.split('?')[0].split('#')[0];

    if (
      cleanUrl.includes('/historial/') ||
      cleanUrl.includes('/nueva') ||
      cleanUrl.includes('/emision-masiva') ||
      cleanUrl.includes('validador-qr') ||
      cleanUrl.includes('branding') ||
      cleanUrl.includes('sin-permisos')
    ) {
      this.primaryAction = null;
      this.viewActions = [];
      return;
    }

    if (cleanUrl.includes('reportes/dashboard') || cleanUrl === '/reportes') {
      if (!this.permissionsService.hasPermission(PERMISSIONS.REP_DASHBOARD_GEN)) {
        this.primaryAction = null;
        this.viewActions = [];
        return;
      }
      this.primaryAction = {
        label: 'Imprimir',
        icon: 'fa fa-print',
        action: () => this.activeComponent?.imprimirReporte?.()
      };
      this.viewActions = [
        {
          id: 'actualizar-reporte',
          label: 'Actualizar',
          icon: 'fa fa-refresh',
          btnClass: 'btn btn-outline-secondary',
          action: () => this.activeComponent?.cargarDatos?.()
        },
        {
          id: 'exportar-csv-reporte',
          label: 'Exportar CSV',
          icon: 'fa fa-download',
          btnClass: 'btn btn-outline-secondary',
          action: () => this.activeComponent?.exportarCSV?.()
        }
      ];
    } else if (cleanUrl.includes('reportes/contadores')) {
      this.primaryAction = null;
      this.viewActions = this.permissionsService.hasPermission(PERMISSIONS.REP_CONT_LISTADO_CSV)
        ? [
          {
            id: 'exportar-csv-subreporte',
            label: 'Exportar CSV',
            icon: 'fa fa-download',
            btnClass: 'btn btn-outline-secondary',
            action: () => this.activeComponent?.exportarCSV?.()
          }
        ]
        : [];
    } else if (cleanUrl.includes('reportes/sociedades')) {
      this.primaryAction = null;
      this.viewActions = this.permissionsService.hasPermission(PERMISSIONS.REP_SOC_LISTADO_CSV)
        ? [
          {
            id: 'exportar-csv-subreporte',
            label: 'Exportar CSV',
            icon: 'fa fa-download',
            btnClass: 'btn btn-outline-secondary',
            action: () => this.activeComponent?.exportarCSV?.()
          }
        ]
        : [];
    } else if (cleanUrl.includes('reportes/notificaciones')) {
      this.primaryAction = null;
      this.viewActions = this.permissionsService.hasPermission(PERMISSIONS.REP_NOTIFICACIONES)
        ? [
          {
            id: 'exportar-csv-subreporte',
            label: 'Exportar CSV',
            icon: 'fa fa-download',
            btnClass: 'btn btn-outline-secondary',
            action: () => this.activeComponent?.exportarCSV?.()
          }
        ]
        : [];
    } else if (cleanUrl.includes('tarjetas-contadores')) {
      this.primaryAction = this.permissionsService.hasPermission(PERMISSIONS.CONT_NUEVA_TARJETA)
        ? {
          label: 'Nueva tarjeta',
          icon: 'fa fa-plus',
          action: () => this.activeComponent?.abrirNuevaTarjeta?.()
        }
        : null;

      this.viewActions = this.permissionsService.hasPermission(PERMISSIONS.CONT_EMISION_MASIVA)
        ? [
          {
            id: 'emision-masiva',
            label: 'Emisión masiva',
            icon: 'fa fa-file-excel-o',
            btnClass: 'btn btn-outline-secondary',
            action: () => this.activeComponent?.abrirEmisionMasiva?.()
          }
        ]
        : [];
    } else if (cleanUrl.includes('tarjetas-sociedades') || cleanUrl === '/sociedades' || cleanUrl.startsWith('/sociedades/')) {
      this.primaryAction = this.permissionsService.hasPermission(PERMISSIONS.SOC_NUEVA_TARJETA)
        ? {
          label: 'Nueva tarjeta',
          icon: 'fa fa-plus',
          action: () => this.activeComponent?.abrirNuevaTarjeta?.()
        }
        : null;

      this.viewActions = this.permissionsService.hasPermission(PERMISSIONS.SOC_EMISION_MASIVA)
        ? [
          {
            id: 'emision-masiva',
            label: 'Emisión masiva',
            icon: 'fa fa-file-excel-o',
            btnClass: 'btn btn-outline-secondary',
            action: () => this.activeComponent?.abrirEmisionMasiva?.()
          }
        ]
        : [];
    } else if (cleanUrl.includes('crud')) {
      this.primaryAction = null;
      this.viewActions = [
        {
          id: 'actualizar-tramites',
          label: 'Actualizar',
          icon: 'fa fa-refresh',
          btnClass: 'btn btn-outline-secondary',
          action: () => this.activeComponent?.obtenerTramites?.()
        },
        {
          id: 'nuevo-tramite',
          label: 'Nuevo trámite',
          icon: 'fa fa-plus',
          btnClass: 'btn btn-primary',
          action: () => this.activeComponent?.abrirCrear?.()
        }
      ];
    } else if (cleanUrl.includes('historial')) {
      this.primaryAction = null;
      this.viewActions = this.permissionsService.hasPermission(PERMISSIONS.NOTIF_NUEVA)
        ? [
          {
            id: 'nueva-notificacion',
            label: 'Nueva notificación',
            icon: 'fa fa-plus',
            btnClass: 'btn btn-primary',
            action: () => this.navegarA('/crear-notificacion')
          }
        ]
        : [];
    } else if (cleanUrl.includes('crear-notificacion')) {
      this.primaryAction = null;
      this.viewActions = this.permissionsService.hasPermission(PERMISSIONS.NOTIF_HISTORIAL)
        ? [
          {
            id: 'ver-historial',
            label: 'Ver historial',
            icon: 'fa fa-history',
            btnClass: 'btn btn-outline-secondary',
            action: () => this.navegarA('/historial')
          }
        ]
        : [];
    } else if (cleanUrl.includes('certificados')) {
      this.primaryAction = null;
      this.viewActions = this.permissionsService.hasPermission(PERMISSIONS.CERT_LISTADO)
        ? [
          {
            id: 'exportar-csv',
            label: 'Exportar CSV',
            icon: 'fa fa-download',
            btnClass: 'btn btn-outline-secondary',
            action: () => this.activeComponent?.exportarCSV?.()
          }
        ]
        : [];
    } else if (cleanUrl.includes('auditoria')) {
      this.primaryAction = null;
      this.viewActions = this.permissionsService.hasPermission(PERMISSIONS.AUDITORIA_API_REG)
        ? [
          {
            id: 'actualizar-auditoria',
            label: 'Actualizar',
            icon: 'fa fa-refresh',
            btnClass: 'btn btn-outline-secondary',
            action: () => this.activeComponent?.cargarAuditoria?.()
          }
        ]
        : [];
    } else {
      this.primaryAction = null;
      this.viewActions = [];
    }
  }

  navegarA(path: string): void {
    if (!path) return;
    if (path.startsWith('http') || path.endsWith('.php') || path.includes('.php') || path === '/admin') {
      window.location.href = path;
      return;
    }
    if (path.startsWith('/admin/tardigitales/')) {
      const internalPath = path.replace('/admin/tardigitales', '') || '/tarjetas-contadores';
      this.currentUrl = internalPath;
      this.updatePageTitle(internalPath);
      this.updateViewActions(internalPath);
      this.cdr.detectChanges();
      this.router.navigateByUrl(internalPath);
      return;
    }
    this.currentUrl = path;
    this.updatePageTitle(path);
    this.updateViewActions(path);
    this.cdr.detectChanges();
    this.router.navigateByUrl(path);
  }

  private _lastActionExecTime = 0;
  private _lastActionExecKey = '';

  ejecutarAccion(action: HeaderAction): void {
    const now = Date.now();
    const key = action?.id || action?.label || 'action';
    if (this._lastActionExecKey === key && (now - this._lastActionExecTime < 600)) {
      this.cdr.detectChanges();
      return;
    }
    this._lastActionExecKey = key;
    this._lastActionExecTime = now;

    this.cdr.detectChanges();
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.cdr.detectChanges();
  }

  onNavigate(event: CustomEvent): void {
    const path = event.detail?.path;
    if (path) {
      this.navegarA(path);
    }
  }

  onAppChange(event: CustomEvent): void {
    const app = event.detail?.app || event.detail;
    if (app?.path) {
      this.navegarA(app.path);
    }
  }

  onPrimaryAction(event: CustomEvent): void {
    const actionObj = this.primaryAction || event.detail?.action;
    if (typeof actionObj?.action !== 'function' && actionObj?.path) {
      this.navegarA(actionObj.path);
    }
    this.cdr.detectChanges();
  }

  onBack(): void {
    if (this.activeComponent && typeof this.activeComponent.volver === 'function') {
      this.activeComponent.volver();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      const fallback = this.permissionsService.getFirstAllowedRoute() || '/tarjetas-contadores';
      this.navegarA(fallback);
    }
  }

  onProfileAction(event: CustomEvent): void {
    const action = event.detail?.action;
    if (action === 'logout') {
      window.location.href = '/admin';
    }
  }
}
