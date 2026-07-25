/**
 * Tipos del módulo de centros de salud y citas.
 * Dev 4: poblar desde Firecrawl/Exa y normalizar aquí.
 */

export interface HealthCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  occupancyPercent: number;
  services: string[];
  phone?: string;
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
