import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Dev 1: Implementar autenticación con Supabase Auth
 * - signInWithPassword / signInWithOAuth
 * - Redirect a /dashboard tras login exitoso
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sana-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Activity className="mx-auto h-10 w-10 text-sana-600" />
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Dev 1: Conectar con Supabase Auth</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="email" placeholder="Correo electrónico" disabled />
          <Input type="password" placeholder="Contraseña" disabled />
          <Button className="w-full" disabled>
            Entrar (próximamente)
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-sana-600 hover:underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
