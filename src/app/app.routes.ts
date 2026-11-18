import { Routes } from '@angular/router';
import { NotificationsHistoryComponent } from './notifications-history/notifications-history.component';
import { TramitesCrudComponent } from './tramites-crud/tramites-crud.component';
import { TarjetasContadoresComponent } from './tarjetas-contadores/tarjetas-contadores.component';
import { TarjetasSociedadesComponent } from './tarjetas-sociedades/tarjetas-sociedades.component';
import { CrearNotificacionComponent } from './crear-notificacion/crear-notificacion.component';
import { ReportesDashboardComponent } from './reportes/reportes-dashboard/reportes-dashboard.component';
import { PlaceholderComponent } from './placeholder/placeholder.component';
import { ValidadorQrComponent } from './validador-qr/validador-qr.component';
import { CertificadosComponent } from './certificados/certificados.component';
import { AuditoriaComponent } from './auditoria/auditoria.component';
import { BrandingComponent } from './branding/branding.component';
import { BrandingInstitucionalComponent } from './branding-institucional/branding-institucional.component';
import { ProcesosLotesComponent } from './procesos-lotes/procesos-lotes.component';
import { authAndPermissionGuard } from './core/guards/permission.guard';
import { PERMISSIONS } from './core/constants/permissions.constants';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tarjetas-contadores',
    pathMatch: 'full',
  },
  {
    path: 'historial',
    component: NotificationsHistoryComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.NOTIF_HISTORIAL },
  },
  {
    path: 'crud',
    component: TramitesCrudComponent,
    canActivate: [authAndPermissionGuard],
  },

  // Rutas semánticas reales - Contadores
  {
    path: 'tarjetas-contadores',
    component: TarjetasContadoresComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.CONT_LISTADO },
  },
  {
    path: 'tarjetas-contadores/nueva',
    component: TarjetasContadoresComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.CONT_NUEVA_TARJETA },
  },
  {
    path: 'tarjetas-contadores/emision-masiva',
    component: TarjetasContadoresComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.CONT_EMISION_MASIVA },
  },
  {
    path: 'tarjetas-contadores/historial/:id',
    component: TarjetasContadoresComponent,
    canActivate: [authAndPermissionGuard],
    data: {
      permissions: [PERMISSIONS.CONT_HISTORIAL, PERMISSIONS.REP_CONT_HISTORIAL],
    },
  },

  // Rutas semánticas reales - Sociedades
  {
    path: 'tarjetas-sociedades',
    component: TarjetasSociedadesComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.SOC_LISTADO },
  },
  {
    path: 'tarjetas-sociedades/nueva',
    component: TarjetasSociedadesComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.SOC_NUEVA_TARJETA },
  },
  {
    path: 'tarjetas-sociedades/emision-masiva',
    component: TarjetasSociedadesComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.SOC_EMISION_MASIVA },
  },
  {
    path: 'tarjetas-sociedades/historial/:id',
    component: TarjetasSociedadesComponent,
    canActivate: [authAndPermissionGuard],
    data: {
      permissions: [PERMISSIONS.SOC_HISTORIAL, PERMISSIONS.REP_SOC_HISTORIAL],
    },
  },
  {
    path: 'sociedades',
    redirectTo: 'tarjetas-sociedades',
    pathMatch: 'full',
  },
  {
    path: 'sociedades/nueva',
    redirectTo: 'tarjetas-sociedades/nueva',
    pathMatch: 'full',
  },
  {
    path: 'sociedades/emision-masiva',
    redirectTo: 'tarjetas-sociedades/emision-masiva',
    pathMatch: 'full',
  },
  {
    path: 'sociedades/historial/:id',
    redirectTo: 'tarjetas-sociedades/historial/:id',
    pathMatch: 'full',
  },
  {
    path: 'crear-notificacion',
    component: CrearNotificacionComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.NOTIF_NUEVA },
  },
  {
    path: 'reportes',
    redirectTo: 'reportes/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'reportes/dashboard',
    component: ReportesDashboardComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.REP_DASHBOARD_GEN },
  },
  {
    path: 'reportes/contadores',
    component: TarjetasContadoresComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.REP_CONT_LISTADO_CSV },
  },
  {
    path: 'reportes/sociedades',
    component: TarjetasSociedadesComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.REP_SOC_LISTADO_CSV },
  },
  {
    path: 'reportes/notificaciones',
    component: NotificationsHistoryComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.REP_NOTIFICACIONES },
  },
  {
    path: 'certificados',
    component: CertificadosComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.CERT_LISTADO },
  },
  {
    path: 'branding',
    component: BrandingComponent,
    canActivate: [authAndPermissionGuard],
    data: {
      permissions: [
        PERMISSIONS.BRAND_CONT_VER,
        PERMISSIONS.BRAND_SOC_VER,
        PERMISSIONS.BRAND_FIRMA_VER,
      ],
    },
  },
  {
    path: 'branding-contadores',
    component: BrandingComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.BRAND_CONT_VER },
  },
  {
    path: 'branding-sociedades',
    component: BrandingComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.BRAND_SOC_VER },
  },
  {
    path: 'branding-institucional',
    component: BrandingInstitucionalComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.BRAND_FIRMA_VER },
  },
  {
    path: 'validador-qr',
    redirectTo: 'validador-qr-contadores',
    pathMatch: 'full',
  },
  {
    path: 'validador-qr-contadores',
    component: ValidadorQrComponent,
    canActivate: [authAndPermissionGuard],
    data: { tipo: 'contadores', permission: PERMISSIONS.VAL_QR_CONTADORES },
  },
  {
    path: 'validador-qr-sociedades',
    component: ValidadorQrComponent,
    canActivate: [authAndPermissionGuard],
    data: { tipo: 'sociedades', permission: PERMISSIONS.VAL_QR_SOCIEDADES },
  },
  {
    path: 'auditoria',
    component: AuditoriaComponent,
    canActivate: [authAndPermissionGuard],
    data: { permission: PERMISSIONS.AUDITORIA_API_REG },
  },
  {
    path: 'procesos-lotes',
    component: ProcesosLotesComponent,
    canActivate: [authAndPermissionGuard],
  },
  {
    path: 'usuarios',
    component: PlaceholderComponent,
    canActivate: [authAndPermissionGuard],
  },
  {
    path: 'sin-permisos',
    component: PlaceholderComponent,
    data: { mode: 'sin-permisos' },
  },
  {
    path: 'construccion',
    component: PlaceholderComponent,
  },
  {
    path: '**',
    redirectTo: 'tarjetas-contadores',
  },
];
