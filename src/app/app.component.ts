import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { MenuSection, UserProfile, AppTile, PrimaryAction } from './core/models/layout.models';

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
export class App implements OnInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  currentUrl = (typeof window !== 'undefined' && window.location.pathname) ? window.location.pathname : '';
  pageTitle = 'Tarjeta Digital para Contadores';
  activeComponent: any = null;
  viewActions: HeaderAction[] = [];
  sidebarCollapsed = false;

  private routeTitles: { [key: string]: string } = {
    '/tarjetas-contadores/historial': 'Historial de la tarjeta',
    '/tarjetas-contadores/nueva': 'Emitir Tarjeta de Contador',
    '/tarjetas-contadores/emision-masiva': 'Emisión Masiva de Credenciales',
    '/tarjetas-contadores': 'Tarjeta Digital para Contadores',
    '/sociedades/historial': 'Historial de la sociedad',
    '/sociedades/nueva': 'Emitir Tarjeta de Sociedad',
    '/sociedades/emision-masiva': 'Emisión Masiva de Sociedades',
    '/sociedades': 'Tarjeta Digital para Sociedades',
    '/historial': 'Historial de Notificaciones',
    '/crear-notificacion': 'Crear Notificación',
    '/crud': 'Gestión de Trámites',
    '/validador-qr': 'Campos del Validador QR',
    '/certificados': 'Certificados Oficiales',
    '/reportes': 'Reportes',
    '/branding': 'Branding de credenciales',
    '/branding-contadores': 'Branding de credenciales — Contadores',
    '/branding-sociedades': 'Branding de credenciales — Sociedades',
    '/auditoria': 'Auditoría API',
    '/usuarios': 'Usuarios'
  };

  // Configuración del usuario para el shell
  currentUser: UserProfile = {
    name: 'Fabian Vargas',
    email: 'fvargas@nexura.com',
    role: 'Administrador',
    initials: 'FV'
  };

  // Acción principal destacada sobre el sidebar (configurable y opcional por vista)
  primaryAction: PrimaryAction | null = null;

  // Configuración de módulos en el menú de aplicaciones del topbar
  appGrid: AppTile[] = [
    { 
      id: 'tarjetas', 
      name: 'Tarjetas Digitales', 
      color: 'blue', 
      iconClass: 'fa fa-id-card', 
      path: '/admin/tardigitales/tarjetas-contadores', 
      active: true 
    },
    { 
      id: 'reportes', 
      name: 'Reportes y Analítica', 
      color: 'purple', 
      iconClass: 'fa fa-bar-chart', 
      path: '/admin/tardigitales/reportes/metricas', 
      active: false 
    }
  ];

  menuSections: MenuSection[] = [
    {
      sectionTitle: 'Gestión principal',
      items: [
        {
          id: 'grupo-tarjetas',
          label: 'Tarjetas',
          icon: 'fa fa-id-card',
          children: [
            { label: 'Tarjetas Contadores', icon: 'fa fa-user', path: '/tarjetas-contadores' },
            { label: 'Tarjetas Sociedades', icon: 'fa fa-building-o', path: '/sociedades' }
          ]
        },
        {
          id: 'grupo-notificaciones',
          label: 'Notificaciones',
          icon: 'fa fa-bell',
          children: [
            { label: 'Crear notificación', icon: 'fa fa-paper-plane', path: '/crear-notificacion' },
            { label: 'Historial de notificaciones', icon: 'fa fa-history', path: '/historial' }
          ]
        }
      ]
    },
    {
      sectionTitle: 'Administración',
      items: [
        { label: 'Certificados', icon: 'fa fa-certificate', path: '/certificados' },
        {
          id: 'grupo-branding',
          label: 'Branding',
          icon: 'fa fa-paint-brush',
          children: [
            { label: 'Contadores', icon: 'fa fa-user', path: '/branding-contadores' },
            { label: 'Sociedades', icon: 'fa fa-building-o', path: '/branding-sociedades' }
          ]
        },
        { label: 'Validador QR', icon: 'fa fa-qrcode', path: '/validador-qr' },
        { label: 'Auditoría API', icon: 'fa fa-shield', path: '/auditoria' },
        { label: 'Usuarios', icon: 'fa fa-users', path: '/usuarios' }
      ]
    }
  ];

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 992) {
      this.sidebarCollapsed = true;
    }
    this.currentUrl = (typeof window !== 'undefined' && window.location.pathname) ? window.location.pathname : this.router.url;
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

  onRouteActivate(componentInstance: any): void {
    this.activeComponent = componentInstance;
    this.currentUrl = (typeof window !== 'undefined' && window.location.pathname) ? window.location.pathname : this.router.url;
    this.updatePageTitle(this.currentUrl);
    this.updateViewActions(this.currentUrl);
    this.cdr.detectChanges();
  }

  private updatePageTitle(url: string) {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const match = Object.keys(this.routeTitles).find(route => cleanUrl.endsWith(route) || cleanUrl.includes(route));
    if (match) {
      this.pageTitle = this.routeTitles[match];
    }
  }

  private updateViewActions(url: string) {
    const cleanUrl = url.split('?')[0].split('#')[0];

    if (cleanUrl.includes('/historial/') || cleanUrl.includes('/nueva') || cleanUrl.includes('/emision-masiva')) {
      this.primaryAction = null;
      this.viewActions = [];
      return;
    }

    if (cleanUrl.includes('tarjetas-contadores')) {
      this.primaryAction = {
        label: 'Nueva tarjeta',
        icon: 'fa fa-plus',
        action: () => this.activeComponent?.abrirNuevaTarjeta?.()
      };
      this.viewActions = [
        {
          id: 'emision-masiva',
          label: 'Emisión masiva',
          icon: 'fa fa-file-excel-o',
          btnClass: 'btn btn-outline-secondary',
          action: () => this.activeComponent?.abrirEmisionMasiva?.()
        }
      ];
    } else if (cleanUrl.includes('branding')) {
      this.primaryAction = null;
      this.viewActions = [];
    } else if (cleanUrl.includes('sociedades')) {
      this.primaryAction = {
        label: 'Nueva tarjeta',
        icon: 'fa fa-plus',
        action: () => this.activeComponent?.abrirNuevaTarjeta?.()
      };
      this.viewActions = [
        {
          id: 'emision-masiva',
          label: 'Emisión masiva',
          icon: 'fa fa-file-excel-o',
          btnClass: 'btn btn-outline-secondary',
          action: () => this.activeComponent?.abrirEmisionMasiva?.()
        }
      ];
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
      this.viewActions = [
        {
          id: 'exportar-csv',
          label: 'Exportar CSV',
          icon: 'fa fa-download',
          btnClass: 'btn btn-outline-secondary',
          action: () => this.activeComponent?.exportarCSV?.()
        },
        {
          id: 'nueva-notificacion',
          label: 'Nueva notificación',
          icon: 'fa fa-plus',
          btnClass: 'btn btn-primary',
          action: () => this.navegarA('/crear-notificacion')
        }
      ];
    } else if (cleanUrl.includes('crear-notificacion')) {
      this.primaryAction = null;
      this.viewActions = [
        {
          id: 'ver-historial',
          label: 'Ver historial',
          icon: 'fa fa-history',
          btnClass: 'btn btn-outline-secondary',
          action: () => this.navegarA('/historial')
        }
      ];
    } else if (cleanUrl.includes('certificados')) {
      this.primaryAction = null;
      this.viewActions = [
        {
          id: 'exportar-csv',
          label: 'Exportar CSV',
          icon: 'fa fa-download',
          btnClass: 'btn btn-outline-secondary',
          action: () => this.activeComponent?.exportarCSV?.()
        }
      ];
    } else if (cleanUrl.includes('auditoria')) {
      this.primaryAction = null;
      this.viewActions = [
        {
          id: 'actualizar-auditoria',
          label: 'Actualizar',
          icon: 'fa fa-refresh',
          btnClass: 'btn btn-outline-secondary',
          action: () => this.activeComponent?.cargarAuditoria?.()
        }
      ];
    } else {
      this.primaryAction = null;
      this.viewActions = [];
    }
  }

  navegarA(path: string): void {
    if (!path) return;
    if (path.startsWith('/admin/tardigitales/reportes') || path.startsWith('/admin/reportes') || path.startsWith('http')) {
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

  ejecutarAccion(action: HeaderAction): void {
    if (action.action) {
      action.action();
      this.cdr.detectChanges();
    }
  }

  // Manejo de eventos emitidos por el Web Component de Lit
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
    const app = event.detail?.app;
    if (app?.path) {
      this.navegarA(app.path);
    }
  }

  onPrimaryAction(event: CustomEvent): void {
    const actionObj = this.primaryAction || event.detail?.action;
    console.log('[MFE] Acción principal solicitada:', actionObj);
    if (typeof actionObj?.action === 'function') {
      actionObj.action();
      this.cdr.detectChanges();
    } else if (actionObj?.path) {
      this.navegarA(actionObj.path);
    }
  }

  onBack(): void {
    if (this.activeComponent && typeof this.activeComponent.volver === 'function') {
      this.activeComponent.volver();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      this.navegarA('/tarjetas-contadores');
    }
  }

  onProfileAction(event: CustomEvent): void {
    const action = event.detail?.action;
    console.log('[MFE] Acción de perfil solicitada:', action);
    if (action === 'logout') {
      alert('Cerrando sesión...');
    }
  }
}
