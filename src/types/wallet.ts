/**
 * Tipos del módulo Wallbit — Billetera de Emergencias Médicas.
 * Dev 2: conectar con endpoints reales de Wallbit aquí.
 */

export interface WalletBalance {
  userId: string;
  availableBalance: number;
  currency: string;
  reservedBalance: number;
  lastSyncedAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "deposit" | "withdrawal" | "emergency_payment" | "refund";
  amount: number;
  currency: string;
  description: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}

export interface EmergencyPaymentRequest {
  userId: string;
  amount: number;
  healthCenterId: string;
  reason: string;
}

export interface EmergencyPaymentResult {
  transactionId: string;
  status: "approved" | "rejected" | "pending";
  message: string;
}
