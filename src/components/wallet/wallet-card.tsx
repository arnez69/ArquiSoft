/**
 * UI de billetera Wallbit — Dev 2
 * TODO: Conectar con getWallbitClient() y mostrar transacciones reales.
 */

import { Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils";
import type { WalletBalance } from "@/types/wallet";

interface WalletCardProps {
  balance?: WalletBalance;
}

const MOCK_BALANCE: WalletBalance = {
  userId: "demo",
  availableBalance: 1500,
  currency: "BOB",
  reservedBalance: 200,
  lastSyncedAt: new Date().toISOString(),
};

export function WalletCard({ balance = MOCK_BALANCE }: WalletCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-sana-600" />
          Billetera de Emergencias
        </CardTitle>
        <CardDescription>Dev 2: Integrar API Wallbit aquí</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-sana-700">
          {formatCurrency(balance.availableBalance, balance.currency)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Reservado: {formatCurrency(balance.reservedBalance, balance.currency)}
        </p>
      </CardContent>
    </Card>
  );
}
