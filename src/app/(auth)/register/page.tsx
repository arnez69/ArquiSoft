import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/** Dev 1: Registro de pacientes con Supabase Auth + tabla profiles */
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sana-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Activity className="mx-auto h-10 w-10 text-sana-600" />
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Dev 1: Formulario de registro con Supabase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="text" placeholder="Nombre completo" disabled />
          <Input type="email" placeholder="Correo electrónico" disabled />
          <Input type="password" placeholder="Contraseña" disabled />
          <Button className="w-full" disabled>
            Registrarse (próximamente)
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-sana-600 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
