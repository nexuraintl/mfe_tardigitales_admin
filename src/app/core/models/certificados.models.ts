export interface AntecedenteCertificado {
  sanctionType: string;
  durationMonths: string | number | null;
  resolutionNumber: string;
  resolutionDate: string;
  enforcementDate: string;
  completionDate: string | null;
}

export type TipoTitularCertificado = 'Contador' | 'Sociedad';

export interface CertificadoItem {
  id: string;
  type: TipoTitularCertificado;
  certificateNumber: string;
  identifier: string; // Documento de identidad o NIT
  holder: string; // Nombre completo o Razón social
  generatedAt: string;
  signedAt: string | null;
  status: string;
  
  // Específicos para Contador
  professionalCard?: string;
  cardType?: string;
  documentMunicipality?: string;
  documentDepartment?: string;
  
  // Específicos para Sociedad
  companyCode?: string;
  legalRepresentative?: string;
  municipality?: string;
  department?: string;

  updatedAt: string;
  antecedents: AntecedenteCertificado[];
}

export interface FiltroCertificados {
  search: string;
  holderType: 'todos' | 'contador' | 'sociedad';
}
