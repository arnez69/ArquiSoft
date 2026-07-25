import Link from "next/link";
import {
  Activity,
  HeartPulse,
  MapPin,
  Phone,
  Shield,
  Sparkles,
} from "lucide-react";
import { AgentChatPlaceholder } from "@/components/agent/agent-chat-placeholder";
import { HealthCenterCard } from "@/components/health/health-center-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletCard } from "@/components/wallet/wallet-card";
import type { HealthCenter } from "@/types/health";

/** Datos demo — Dev 4 reemplazará con búsqueda Exa/Firecrawl */
const DEMO_CENTERS: HealthCenter[] = [
  {
    id: "hc_1",
    name: "Hospital del Norte",
    address: "Av. Costanera 120",
    city: "La Paz",
    latitude: -16.4897,
    longitude: -68.1193,
    occupancyPercent: 42,
    services: ["urgencias", "UCI", "pediatría"],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "hc_2",
    name: "Clínica San Gabriel",
    address: "Calle 6 de Agosto 450",
    city: "La Paz",
    latitude: -16.5001,
    longitude: -68.1342,
    occupancyPercent: 78,
    services: ["consulta general", "laboratorio"],
    lastUpdated: new Date().toISOString(),
  },
];

const FEATURES = [
  {
    icon: HeartPulse,
    title: "Triage inteligente",
    description: "Agente Zavu evalúa síntomas y prioriza atención.",
    dev: "Dev 3",
  },
  {
    icon: Shield,
    title: "Billetera de emergencias",
    description: "Fondos listos para pagos médicos urgentes vía Wallbit.",
    dev: "Dev 2",
  },
  {
    icon: MapPin,
    title: "Centros de salud",
    description: "Disponibilidad en tiempo real con Firecrawl y Exa.",
    dev: "Dev 4",
  },
  {
    icon: Sparkles,
    title: "Resúmenes visuales",
    description: "Infografías médicas generadas con fal.ai.",
    dev: "Dev 4",
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sana-50 to-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-sana-600" />
            <div>
              <h1 className="text-xl font-bold text-sana-700">SanaIA</h1>
              <p className="text-xs text-muted-foreground">Cursor Buildathon Bolivia 2026</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Iniciar sesión</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Registrarse</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Hero */}
        <section className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tu asistente médico de emergencias
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            PWA integral para pacientes bolivianos: voz, billetera de emergencias y
            disponibilidad hospitalaria en un solo lugar.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="destructive" size="lg">
              <Phone className="h-4 w-4" />
              Emergencia
            </Button>
            <Link href="/dashboard">
              <Button size="lg">Ir al panel</Button>
            </Link>
          </div>
        </section>

        {/* Dashboard MVP grid */}
        <section className="mb-10 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AgentChatPlaceholder />
          </div>
          <div className="space-y-6">
            <WalletCard />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado del sistema</CardTitle>
                <CardDescription>Integraciones activas (modo desarrollo)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {["Supabase", "Zavu", "Wallbit", "ElevenLabs", "Firecrawl", "Exa", "fal.ai"].map(
                  (service) => (
                    <div key={service} className="flex items-center justify-between">
                      <span>{service}</span>
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                        Mock
                      </span>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Health centers */}
        <section className="mb-10">
          <h3 className="mb-4 text-xl font-semibold">Centros de salud cercanos</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {DEMO_CENTERS.map((center) => (
              <HealthCenterCard key={center.id} center={center} />
            ))}
          </div>
        </section>

        {/* Team integration guide */}
        <section>
          <h3 className="mb-4 text-xl font-semibold">Áreas de integración del equipo</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description, dev }) => (
              <Card key={title}>
                <CardHeader>
                  <Icon className="mb-2 h-8 w-8 text-sana-600" />
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="rounded bg-muted px-2 py-1 text-xs font-medium">{dev}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        SanaIA © 2026 — Hecho con ❤️ para Bolivia
      </footer>
    </div>
  );
}
