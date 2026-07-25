import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase — Dev 1 (Auth & Database)
 *
 * Responsabilidades del equipo:
 * - Configurar tablas: users, profiles, appointments, wallet_links
 * - Implementar auth flows en (auth)/ routes
 * - Row Level Security (RLS) policies
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[SanaIA] Supabase no configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
  );
}

/** Cliente público para uso en componentes del cliente (browser) */
export function createBrowserClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase: variables de entorno no configuradas");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

/** Cliente singleton para el browser — lazy init */
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}

/**
 * Cliente server-side con service role (solo API routes / Server Components).
 * Dev 1: usar SUPABASE_SERVICE_ROLE_KEY para operaciones privilegiadas.
 */
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server: variables de entorno no configuradas");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
