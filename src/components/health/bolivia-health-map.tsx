"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HealthCenter } from "@/types/health";
import { Phone, ExternalLink, ShieldCheck, Activity, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

/** Componente interno para animar el mapa hacia las nuevas coordenadas */
function MapController({ center, zoom }: MapControllerProps) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5,
    });
  }, [center, zoom, map]);
  return null;
}

/** Crear icono personalizado SVG para Leaflet según nivel de ocupación */
function createCustomPin(occupancy: number, isSelected: boolean) {
  let colorClass = "bg-emerald-500 border-emerald-300";
  let pulseClass = "bg-emerald-400";
  if (occupancy > 75) {
    colorClass = "bg-rose-600 border-rose-300";
    pulseClass = "bg-rose-500";
  } else if (occupancy > 50) {
    colorClass = "bg-amber-500 border-amber-300";
    pulseClass = "bg-amber-400";
  }

  const selectedRing = isSelected ? "ring-4 ring-sana-500 ring-offset-2 scale-125 z-[1000]" : "";

  const html = `
    <div class="relative flex items-center justify-center transition-transform duration-300 ${selectedRing}">
      <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full ${pulseClass} opacity-75"></span>
      <div class="relative inline-flex h-8 w-8 items-center justify-center rounded-full ${colorClass} text-white shadow-lg border-2 font-bold text-xs">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20M2 12h20"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-leaflet-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

interface BoliviaHealthMapProps {
  centers: HealthCenter[];
  selectedCenterId: string | null;
  onSelectCenter: (center: HealthCenter) => void;
  departmentConfig: { lat: number; lng: number; zoom: number };
}

export default function BoliviaHealthMap({
  centers,
  selectedCenterId,
  onSelectCenter,
  departmentConfig,
}: BoliviaHealthMapProps) {
  const mapCenter: [number, number] = [departmentConfig.lat, departmentConfig.lng];

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-border shadow-md">
      <MapContainer
        center={mapCenter}
        zoom={departmentConfig.zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0 bg-slate-900"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={mapCenter} zoom={departmentConfig.zoom} />

        {centers.map((center) => {
          const isSelected = center.id === selectedCenterId;
          const pinIcon = createCustomPin(center.occupancyPercent, isSelected);

          return (
            <Marker
              key={center.id}
              position={[center.latitude, center.longitude]}
              icon={pinIcon}
              eventHandlers={{
                click: () => onSelectCenter(center),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 max-w-xs space-y-2 text-foreground font-sans">
                  {/* Encabezado */}
                  <div className="flex items-start justify-between gap-2 border-b pb-2 border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sana-100 text-sana-800 dark:bg-sana-900 dark:text-sana-200">
                        {center.type}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1 leading-tight">
                        {center.name}
                      </h4>
                    </div>
                  </div>

                  {/* Dirección y Depto */}
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-sana-600 shrink-0" />
                    <span>{center.address}, {center.city}</span>
                  </p>

                  {/* Ocupación */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-slate-500 dark:text-slate-400">Ocupación estimada:</span>
                      <span
                        className={`font-bold ${
                          center.occupancyPercent > 75
                            ? "text-rose-600 dark:text-rose-400"
                            : center.occupancyPercent > 50
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {center.occupancyPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          center.occupancyPercent > 75
                            ? "bg-rose-500"
                            : center.occupancyPercent > 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${center.occupancyPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Especialidades */}
                  <div className="flex flex-wrap gap-1">
                    {center.services.map((serv) => (
                      <span
                        key={serv}
                        className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded"
                      >
                        {serv}
                      </span>
                    ))}
                  </div>

                  {/* Acciones */}
                  <div className="pt-2 flex gap-1.5">
                    {center.phoneEmergency && (
                      <a
                        href={`tel:${center.phoneEmergency}`}
                        className="flex-1 inline-flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold py-1.5 px-2 transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        Emergencia
                      </a>
                    )}
                    {center.sourceUrl && (
                      <a
                        href={center.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded transition-colors"
                        title="Ver sitio web"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
