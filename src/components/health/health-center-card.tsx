"use client";

import { useState } from "react";
import { Building2, MapPin, CreditCard, Globe, RefreshCw, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { HealthCenter } from "@/types/health";

interface HealthCenterCardProps {
  center: HealthCenter;
}

export function HealthCenterCard({ center }: HealthCenterCardProps) {
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedInfo, setScrapedInfo] = useState<string | null>(null);

  const occupancyColor =
    center.occupancyPercent > 80
      ? "text-red-600"
      : center.occupancyPercent > 50
        ? "text-yellow-600"
        : "text-green-600";

  const handlePay = () => {
    // Dispatch custom event to communicate with WalletCard
    const event = new CustomEvent("trigger-wallet-payment", {
      detail: { hospitalName: center.name }
    });
    window.dispatchEvent(event);
  };

  const handleScrape = async () => {
    if (!center.sourceUrl) {
      alert("Este centro no tiene un sitio web registrado para extraer información.");
      return;
    }

    setIsScraping(true);
    try {
      const res = await fetch("/api/health-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: center.sourceUrl }),
      });

      if (!res.ok) throw new Error("Error scraping web info");

      const data = await res.json();
      setScrapedInfo(data.markdown || "No se pudo extraer contenido legible.");
    } catch (err) {
      console.error(err);
      setScrapedInfo("Error al extraer información desde el portal del centro de salud.");
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <>
      <Card className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow border-sana-100">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-sana-800">
              <Building2 className="h-4.5 w-4.5 text-sana-600" />
              {center.name}
            </CardTitle>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              center.occupancyPercent > 80 
                ? "bg-red-50 text-red-700 border border-red-200" 
                : center.occupancyPercent > 50 
                ? "bg-yellow-50 text-yellow-700 border border-yellow-200" 
                : "bg-green-50 text-green-700 border border-green-200"
            }`}>
              {center.occupancyPercent}% Ocupado
            </span>
          </div>
          <CardDescription className="flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            {center.address}, {center.city}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-3">
          <div className="flex flex-wrap gap-1 mt-1">
            {center.services.map((service) => (
              <span
                key={service}
                className="rounded-full bg-sana-50 px-2 py-0.5 text-[10px] font-semibold text-sana-700 border border-sana-100"
              >
                {service}
              </span>
            ))}
          </div>
        </CardContent>

        <CardFooter className="pt-2 border-t flex gap-2 justify-end bg-sana-50/20 p-4">
          {center.sourceUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleScrape}
              disabled={isScraping}
              className="text-xs border-sana-200 hover:bg-sana-50 text-sana-700 flex gap-1 items-center h-8"
              title="Scrape sitio oficial con Firecrawl"
            >
              {isScraping ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
              Sitio Web
            </Button>
          )}
          <Button
            size="sm"
            onClick={handlePay}
            className="text-xs bg-sana-600 hover:bg-sana-700 text-white flex gap-1 items-center h-8"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Pagar Emergencia
          </Button>
        </CardFooter>
      </Card>

      {/* Scrape Info Modal */}
      {scrapedInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col bg-white">
            <CardHeader className="bg-sana-600 text-white flex flex-row items-center justify-between p-4 pb-3 rounded-t-lg">
              <div>
                <CardTitle className="text-md font-bold">Información de {center.name}</CardTitle>
                <CardDescription className="text-sana-100 text-xs">Extraído en tiempo real vía Firecrawl</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setScrapedInfo(null)} className="text-white hover:bg-sana-500/50">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto p-6 text-sm whitespace-pre-wrap leading-relaxed flex-1">
              {scrapedInfo}
            </CardContent>
            <CardFooter className="border-t p-3 flex justify-end bg-sana-50/30">
              <Button onClick={() => setScrapedInfo(null)} className="bg-sana-600 hover:bg-sana-700 text-white text-xs">
                Cerrar
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
