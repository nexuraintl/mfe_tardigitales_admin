import { Routes } from '@angular/router';
import { NotificationsHistoryComponent } from './notifications-history/notifications-history.component';
import { TramitesCrudComponent } from './tramites-crud/tramites-crud.component';
import { TarjetasContadoresComponent } from './tarjetas-contadores/tarjetas-contadores.component';
import { TarjetasSociedadesComponent } from './tarjetas-sociedades/tarjetas-sociedades.component';
import { CrearNotificacionComponent } from './crear-notificacion/crear-notificacion.component';
import { PlaceholderComponent } from './placeholder/placeholder.component';
import { ValidadorQrComponent } from './validador-qr/validador-qr.component';
import { CertificadosComponent } from './certificados/certificados.component';
import { AuditoriaComponent } from './auditoria/auditoria.component';
import { BrandingComponent } from './branding/branding.component';
import { ProcesosLotesComponent } from './procesos-lotes/procesos-lotes.component';

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
    path: 'sociedades',
    component: TarjetasSociedadesComponent
  },
  {
    path: 'sociedades/nueva',
    component: TarjetasSociedadesComponent
  },
  {
    path: 'sociedades/emision-masiva',
    component: TarjetasSociedadesComponent
  },
  {
    path: 'sociedades/historial/:id',
    component: TarjetasSociedadesComponent
  },
  {
    path: 'crear-notificacion',
    component: CrearNotificacionComponent
  },
  {
    path: 'reportes',
    component: PlaceholderComponent
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
    path: 'validador-qr',
    component: ValidadorQrComponent
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

  // Ruta genérica fallback por si acaso
  {
    path: 'construccion',
    component: PlaceholderComponent
  },
  {
    path: '**',
    redirectTo: 'tarjetas-contadores'
  }
];

