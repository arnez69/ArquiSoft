/**
 * UI del agente conversacional — Dev 3
 * TODO: Implementar chat streaming, botón de voz y historial de sesiones.
 */

import { MessageCircle, Mic } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AgentChatPlaceholder() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-sana-600" />
          Asistente SanaIA
        </CardTitle>
        <CardDescription>
          Dev 3: Integrar chat con Zavu y controles de voz aquí
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          Hola, soy tu asistente médico. ¿En qué puedo ayudarte hoy?
        </div>
        <Button variant="outline" className="w-full" disabled>
          <Mic className="h-4 w-4" />
          Mantén para hablar (próximamente)
        </Button>
      </CardContent>
    </Card>
  );
}
