/**
 * Tarjetas de centros de salud — Dev 4
 * TODO: Mapa interactivo y datos en tiempo real desde Firecrawl/Exa.
 */

import { Building2, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthCenter } from "@/types/health";

interface HealthCenterCardProps {
  center: HealthCenter;
}

export function HealthCenterCard({ center }: HealthCenterCardProps) {
  const occupancyColor =
    center.occupancyPercent > 80
      ? "text-emergency-600"
      : center.occupancyPercent > 50
        ? "text-yellow-600"
        : "text-green-600";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-sana-600" />
          {center.name}
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {center.address}, {center.city}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className={`text-sm font-medium ${occupancyColor}`}>
          Ocupación: {center.occupancyPercent}%
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {center.services.map((service) => (
            <span
              key={service}
              className="rounded-full bg-sana-50 px-2 py-0.5 text-xs text-sana-700"
            >
              {service}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
