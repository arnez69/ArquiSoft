import type {
  EmergencyPaymentRequest,
  EmergencyPaymentResult,
  WalletBalance,
  WalletTransaction,
} from "@/types/wallet";

/**
 * Cliente API Wallbit — Dev 2 (Billetera de Emergencias)
 *
 * Responsabilidades del equipo:
 * - Autenticación con WALLBIT_API_KEY
 * - Consulta de saldo y historial de transacciones
 * - Pagos de emergencia vinculados a centros de salud
 */

const WALLBIT_API_KEY = process.env.WALLBIT_API_KEY;
const WALLBIT_BASE_URL = process.env.WALLBIT_BASE_URL ?? "https://api.wallbit.io/v1";

export class WallbitClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? WALLBIT_API_KEY ?? "";
    this.baseUrl = baseUrl ?? WALLBIT_BASE_URL;

    if (!this.apiKey) {
      console.warn("[SanaIA] WALLBIT_API_KEY no configurada. Modo mock activo.");
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error("Wallbit: API key no configurada");
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Wallbit API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  /** Obtiene el saldo de la billetera de emergencias del usuario */
  async getBalance(userId: string): Promise<WalletBalance> {
    if (!this.apiKey) return this.mockBalance(userId);

    // TODO Dev 2: Endpoint real de Wallbit
    return this.request<WalletBalance>(`/wallets/${userId}/balance`);
  }

  /** Lista transacciones recientes */
  async getTransactions(userId: string, limit = 10): Promise<WalletTransaction[]> {
    if (!this.apiKey) return this.mockTransactions(userId);

    return this.request<WalletTransaction[]>(
      `/wallets/${userId}/transactions?limit=${limit}`
    );
  }

  /** Procesa un pago de emergencia médica */
  async processEmergencyPayment(
    payment: EmergencyPaymentRequest
  ): Promise<EmergencyPaymentResult> {
    if (!this.apiKey) {
      return {
        transactionId: `mock_tx_${Date.now()}`,
        status: "approved",
        message: "Pago mock aprobado. Configura WALLBIT_API_KEY para producción.",
      };
    }

    return this.request<EmergencyPaymentResult>("/payments/emergency", {
      method: "POST",
      body: JSON.stringify(payment),
    });
  }

  private mockBalance(userId: string): WalletBalance {
    return {
      userId,
      availableBalance: 1500.0,
      currency: "BOB",
      reservedBalance: 200.0,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  private mockTransactions(userId: string): WalletTransaction[] {
    return [
      {
        id: "tx_mock_1",
        userId,
        type: "deposit",
        amount: 500,
        currency: "BOB",
        description: "Recarga mensual",
        status: "completed",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }
}

let wallbitClient: WallbitClient | null = null;

export function getWallbitClient(): WallbitClient {
  if (!wallbitClient) {
    wallbitClient = new WallbitClient();
  }
  return wallbitClient;
}
