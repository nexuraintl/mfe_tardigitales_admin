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
import { VerificarPublicaComponent } from './verificar-publica/verificar-publica.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'historial',
    pathMatch: 'full'
  },
  {
    path: 'historial',
    component: NotificationsHistoryComponent
  },
  {
    path: 'crud',
    component: TramitesCrudComponent
  },
  
  // Rutas semánticas reales - Contadores
  {
    path: 'tarjetas-contadores',
    component: TarjetasContadoresComponent
  },
  {
    path: 'tarjetas-contadores/nueva',
    component: TarjetasContadoresComponent
  },
  {
    path: 'tarjetas-contadores/emision-masiva',
    component: TarjetasContadoresComponent
  },
  {
    path: 'tarjetas-contadores/historial/:id',
    component: TarjetasContadoresComponent
  },

  // Rutas semánticas reales - Sociedades
  {
    path: 'tarjetas-sociedades',
    component: TarjetasSociedadesComponent
  },
  {
    path: 'tarjetas-sociedades/nueva',
    component: TarjetasSociedadesComponent
  },
  {
    path: 'tarjetas-sociedades/emision-masiva',
    component: TarjetasSociedadesComponent
  },
  {
    path: 'tarjetas-sociedades/historial/:id',
    component: TarjetasSociedadesComponent
  },
  {
    path: 'sociedades',
    redirectTo: 'tarjetas-sociedades',
    pathMatch: 'full'
  },
  {
    path: 'sociedades/nueva',
    redirectTo: 'tarjetas-sociedades/nueva',
    pathMatch: 'full'
  },
  {
    path: 'sociedades/emision-masiva',
    redirectTo: 'tarjetas-sociedades/emision-masiva',
    pathMatch: 'full'
  },
  {
    path: 'sociedades/historial/:id',
    redirectTo: 'tarjetas-sociedades/historial/:id',
    pathMatch: 'full'
  },
  {
    path: 'crear-notificacion',
    component: CrearNotificacionComponent
  },
  {
    path: 'reportes',
    redirectTo: 'reportes/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'reportes/dashboard',
    component: ReportesDashboardComponent
  },
  {
    path: 'reportes/contadores',
    component: TarjetasContadoresComponent
  },
  {
    path: 'reportes/sociedades',
    component: TarjetasSociedadesComponent
  },
  {
    path: 'reportes/notificaciones',
    component: NotificationsHistoryComponent
  },
  {
    path: 'certificados',
    component: CertificadosComponent
  },
  {
    path: 'branding',
    component: BrandingComponent
  },
  {
    path: 'branding-contadores',
    component: BrandingComponent
  },
  {
    path: 'branding-sociedades',
    component: BrandingComponent
  },
  {
    path: 'branding-institucional',
    component: BrandingInstitucionalComponent
  },
  {
    path: 'validador-qr',
    redirectTo: 'validador-qr-contadores',
    pathMatch: 'full'
  },
  {
    path: 'validador-qr-contadores',
    component: ValidadorQrComponent,
    data: { tipo: 'contadores' }
  },
  {
    path: 'validador-qr-sociedades',
    component: ValidadorQrComponent,
    data: { tipo: 'sociedades' }
  },
  {
    path: 'auditoria',
    component: AuditoriaComponent
  },
  {
    path: 'procesos-lotes',
    component: ProcesosLotesComponent
  },
  {
    path: 'usuarios',
    component: PlaceholderComponent
  },

  // Ruta pública de simulación de verificación QR
  {
    path: 'verificar',
    component: VerificarPublicaComponent
  },
  {
    path: 'verificar/:token',
    component: VerificarPublicaComponent
  },
  {
    path: 'admin/tardigitales/verificar',
    component: VerificarPublicaComponent
  },
  {
    path: 'admin/tardigitales/verificar/:token',
    component: VerificarPublicaComponent
  },
  {
    path: 'construccion',
    component: PlaceholderComponent
  },
  {
    path: '**',
    redirectTo: 'tarjetas-contadores'
  }
];

