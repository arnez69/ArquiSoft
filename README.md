# SanaIA

**PWA de salud inteligente** para el **Cursor Buildathon Bolivia 2026**.

SanaIA conecta un asistente médico conversacional (Zavu), una billetera de emergencias (Wallbit), procesamiento de voz (ElevenLabs/Whisper) y búsqueda de centros de salud (Firecrawl/Exa) en una experiencia móvil lista para producción.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend / PWA | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI | Patrones Shadcn/UI, Lucide Icons |
| Backend | API Routes de Next.js (Node.js/TypeScript) |
| Auth & DB | Supabase |
| Agente | SDK Zavu |
| Billetera | Wallbit API |
| Voz | ElevenLabs + Whisper (OpenAI) |
| Búsqueda | Firecrawl + Exa |
| Visuales | fal.ai |

---

## Instalación rápida

```bash
# 1. Clonar e instalar dependencias
git clone <repo-url> sana-ia
cd sana-ia
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus API keys

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run type-check` | Verificación TypeScript |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/          # Login y registro
│   ├── (dashboard)/     # Panel del paciente
│   ├── api/
│   │   ├── agent/       # Orquestación Zavu
│   │   ├── wallbit/     # Billetera de emergencias
│   │   ├── voice/       # Audio ElevenLabs/Whisper
│   │   └── health-centers/  # Firecrawl/Exa
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              # Botones, tarjetas, inputs
│   ├── agent/           # Chat y voz
│   ├── wallet/          # UI Wallbit
│   └── health/          # Centros de salud
├── lib/                 # Clientes SDK
├── types/               # Interfaces TypeScript
└── utils/               # Utilidades compartidas
```

---

## Guía por desarrollador

### Dev 1 — Auth & Supabase

**Tu zona:** autenticación, perfiles de usuario y base de datos.

| Archivo / Ruta | Tarea |
|----------------|-------|
| `src/lib/supabase.ts` | Clientes browser y server |
| `src/app/(auth)/login/` | Login con Supabase Auth |
| `src/app/(auth)/register/` | Registro + tabla `profiles` |
| `.env.local` | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` |

**Checklist:**
- [ ] Crear proyecto en Supabase
- [ ] Tablas: `profiles`, `appointments`, `agent_sessions`
- [ ] Políticas RLS
- [ ] Middleware de auth para `(dashboard)/`

---

### Dev 2 — Wallbit (Billetera de Emergencias)

**Tu zona:** saldo, transacciones y pagos de emergencia.

| Archivo / Ruta | Tarea |
|----------------|-------|
| `src/lib/wallbit.ts` | Cliente API Wallbit |
| `src/types/wallet.ts` | Tipos de billetera |
| `src/components/wallet/` | UI de saldo e historial |
| `src/app/api/wallbit/route.ts` | Endpoints REST |

**Checklist:**
- [ ] Integrar `WALLBIT_API_KEY`
- [ ] Conectar `WalletCard` con `/api/wallbit`
- [ ] Flujo de pago de emergencia vinculado a centros de salud

---

### Dev 3 — Agente Zavu & Voz

**Tu zona:** chat inteligente, triage y asistente de voz.

| Archivo / Ruta | Tarea |
|----------------|-------|
| `src/lib/zavu.ts` | SDK del agente |
| `src/lib/elevenlabs.ts` | TTS (ElevenLabs) + STT (Whisper) |
| `src/types/agent.ts` | Tipos de mensajes y sesiones |
| `src/components/agent/` | UI de chat y micrófono |
| `src/app/api/agent/route.ts` | Orquestación del agente |
| `src/app/api/voice/route.ts` | Upload y procesamiento de audio |

**Checklist:**
- [ ] Integrar `ZAVU_API_KEY`
- [ ] Chat streaming en el dashboard
- [ ] Grabación de voz → Whisper → Zavu → ElevenLabs TTS
- [ ] Acciones sugeridas (buscar hospital, activar billetera)

---

### Dev 4 — Salud, Scraping & Visuales

**Tu zona:** centros de salud, mapas y resúmenes visuales.

| Archivo / Ruta | Tarea |
|----------------|-------|
| `src/lib/firecrawl.ts` | Scraping Firecrawl + búsqueda Exa |
| `src/lib/fal.ts` | Resúmenes visuales con fal.ai |
| `src/types/health.ts` | Tipos de centros y citas |
| `src/components/health/` | Tarjetas y mapa |
| `src/app/api/health-centers/route.ts` | Búsqueda y scrape |

**Checklist:**
- [ ] Integrar `FIRECRAWL_API_KEY` y `EXA_API_KEY`
- [ ] Normalizar datos de hospitales bolivianos
- [ ] Mapa interactivo (Leaflet/Mapbox)
- [ ] Infografías de triage con `FAL_API_KEY`

---

## API Routes (referencia)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/agent` | Health check del agente |
| `POST` | `/api/agent` | Enviar mensaje al agente Zavu |
| `GET` | `/api/wallbit?userId=` | Saldo y transacciones |
| `POST` | `/api/wallbit` | Pago de emergencia |
| `GET` | `/api/voice` | Info del módulo de voz |
| `POST` | `/api/voice` | STT (audio) o TTS (texto) |
| `GET` | `/api/health-centers?city=` | Búsqueda Exa |
| `POST` | `/api/health-centers` | Scrape Firecrawl |

---

## Modo mock

Sin API keys configuradas, todos los clientes en `src/lib/` devuelven **datos mock** para que el equipo pueda desarrollar la UI en paralelo. Configura `.env.local` para activar integraciones reales.

---

## Contribuir

1. Crea una rama: `git checkout -b feat/dev{N}-descripcion`
2. Trabaja en tu zona asignada (ver guía arriba)
3. Ejecuta `npm run type-check && npm run lint` antes del PR
4. Abre Pull Request con descripción clara

---

## Licencia

Proyecto del Cursor Buildathon Bolivia 2026.
