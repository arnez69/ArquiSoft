/**
 * Tipos del módulo de centros de salud y citas.
 * Dev 4: poblar desde Firecrawl/Exa y normalizar aquí.
 */

export type BoliviaDepartment =
  | "La Paz"
  | "Santa Cruz"
  | "Cochabamba"
  | "Oruro"
  | "Potosí"
  | "Tarija"
  | "Chuquisaca"
  | "Beni"
  | "Pando";

export type HospitalType = "Público" | "Privado" | "Seguro Social (CNS)";

export interface HealthCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  department: BoliviaDepartment;
  type: HospitalType;
  latitude: number;
  longitude: number;
  occupancyPercent: number;
  services: string[];
  phone?: string;
  phoneEmergency?: string;
  sourceUrl?: string;
  lastUpdated: string;
}

export interface AppointmentTicket {
  id: string;
  userId: string;
  healthCenterId: string;
  healthCenterName: string;
  specialty: string;
  scheduledAt: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  agentNotes?: string;
  createdAt: string;
}

export interface HealthSearchQuery {
  city: string;
  specialty?: string;
  /** Radio de búsqueda en km */
  radiusKm?: number;
  /** Solo centros con baja ocupación */
  maxOccupancy?: number;
}

export interface HealthSearchResult {
  centers: HealthCenter[];
  query: HealthSearchQuery;
  searchedAt: string;
}
