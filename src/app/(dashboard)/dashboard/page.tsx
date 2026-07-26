import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";
import { AgentChatPlaceholder } from "@/components/agent/agent-chat-placeholder";
import { HealthCenterCard } from "@/components/health/health-center-card";
import { Button } from "@/components/ui/button";
import { WalletCard } from "@/components/wallet/wallet-card";
import type { HealthCenter } from "@/types/health";

const DEMO_CENTER: HealthCenter = {
  id: "hc_dash",
  name: "Hospital Central",
  address: "Zona Sur",
  city: "La Paz",
  department: "La Paz",
  type: "Público",
  latitude: -16.5,
  longitude: -68.15,
  occupancyPercent: 55,
  services: ["urgencias"],
  lastUpdated: new Date().toISOString(),
};

/** Panel principal del paciente — cada dev extiende su módulo aquí */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Activity className="h-6 w-6 text-sana-600" />
          <h1 className="text-lg font-semibold">Panel del paciente</h1>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-6 p-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AgentChatPlaceholder />
        </div>
        <div className="space-y-6">
          <WalletCard />
          <HealthCenterCard center={DEMO_CENTER} />
        </div>
      </main>
    </div>
  );
}
