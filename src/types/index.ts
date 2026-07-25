/**
 * Tipos globales de SanaIA — punto de entrada central.
 * User vive aquí; dominios específicos en ./agent, ./wallet, ./health.
 */

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: "patient" | "caregiver" | "admin";
  createdAt: string;
  updatedAt: string;
}

export type { AgentMessage, AgentSession, AgentRequest, AgentResponse, AgentAction, AgentConfig } from "./agent";
export type { WalletBalance, WalletTransaction, EmergencyPaymentRequest, EmergencyPaymentResult } from "./wallet";
export type { HealthCenter, AppointmentTicket, HealthSearchQuery, HealthSearchResult } from "./health";
