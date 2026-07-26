"use client";

import dynamic from "next/dynamic";
import { HealthCenter } from "@/types/health";
import { Loader2, MapPin } from "lucide-react";

interface BoliviaHealthMapProps {
  centers: HealthCenter[];
  selectedCenterId: string | null;
  onSelectCenter: (center: HealthCenter) => void;
  departmentConfig: { lat: number; lng: number; zoom: number };
}

/** Dynamic import with SSR disabled for Leaflet map */
const DynamicMap = dynamic(() => import("./bolivia-health-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-2xl border border-border bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-3 shadow-md">
      <Loader2 className="h-8 w-8 text-sana-400 animate-spin" />
      <div className="text-center">
        <p className="text-sm font-semibold flex items-center justify-center gap-1.5">
          <MapPin className="h-4 w-4 text-sana-500" />
          Cargando Mapa GPS de Bolivia...
        </p>
        <p className="text-xs text-slate-500 mt-0.5">Renderizando vista satelital y marcadores de hospitales</p>
      </div>
    </div>
  ),
});

export function MapWrapper(props: BoliviaHealthMapProps) {
  return <DynamicMap {...props} />;
}
