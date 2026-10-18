# SmartCar · Frontend (React PWA)

La app que usas en la computadora y en el teléfono. Habla con la
[API de Flask](../backend/README.md), así que los dos dispositivos ven los mismos datos.

**Tecnologías:** React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router ·
TanStack Query · React Hook Form + Zod · Recharts · PWA (vite-plugin-pwa) · Vitest

---

## 1. Qué tiene

| Sección | Qué hace |
|---|---|
| **Iniciar sesión** | Botón de Google. Si el correo es nuevo, la cuenta se crea sola. |
| **Estado general** (`/estado`) | Millaje actual, semáforo de cada componente (al día, próximo, vencido), rendimiento en millas por galón con las fechas de mantenimiento marcadas, MPG antes y después de cada mantenimiento, gasto por mes y cuánto dura cada cambio. Cada gráfica tiene una vista de tabla. |
| **Registrar** (`/registrar`) | Mantenimientos, cargas de combustible y vehículos. Avisa si el millaje no cuadra con registros anteriores. |
| **Consultar** (`/consultar`) | Historial con filtros por tipo y fechas (quedan en la URL), editar y borrar. |
| **Mis vehículos** (`/vehiculos`) | Agregar, editar, elegir el activo, eliminar y personalizar cada cuánto toca cada mantenimiento. |

Funciona en modo claro y oscuro (según el sistema) y se puede instalar como app.

---

## 2. Correrlo en tu computadora (Windows)

### 2.1 Requisitos
- **Node.js 22.22 o superior** (recomendado 24 LTS): https://nodejs.org
- El backend corriendo en `http://127.0.0.1:5000` (ver [backend/README.md](../backend/README.md)).

### 2.2 Instalar y arrancar
```powershell
cd SmartCar\frontend
npm install
copy .env.example .env
npm run dev
```
Abre http://localhost:5173.

### 2.3 Entrar sin configurar Google (modo desarrollo)
1. En el backend: `flask seed-demo tu_correo@gmail.com` (crea un carro con un año de datos de ejemplo).
2. En el backend: `flask dev-token tu_correo@gmail.com` y copia el token.
3. En la pantalla de inicio de sesión abre **"Modo desarrollo: entrar con token"** y pégalo.

Esa opción solo existe con `npm run dev`; no aparece en la versión publicada.

### 2.4 Login con Google
En `.env` pon el mismo Client ID que usa el backend:
```
VITE_GOOGLE_CLIENT_ID=123456789-xxxxxxxx.apps.googleusercontent.com
```
En Google Cloud Console, el cliente OAuth debe tener como orígenes autorizados
`http://localhost` y `http://localhost:5173` (más tu dominio publicado).
Los pasos completos están en la sección 3 del [README del backend](../backend/README.md).

### 2.5 Comandos
| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga al guardar |
| `npm test` | Pruebas (Vitest) |
| `npm run typecheck` | Revisión de tipos de TypeScript |
| `npm run lint` | Revisión del código (oxlint) |
| `npm run build` | Versión optimizada para publicar (carpeta `dist/`) |
| `npm run preview` | Probar localmente la versión de `build` |
| `npm run icons` | Regenerar los íconos de la app desde `public/logo.svg` |

---

## 3. Cómo está organizado

```
frontend/src/
├── app/            Router, cliente de TanStack Query, pantallas de error
├── components/
│   ├── layout/     Encabezado, selector de vehículo, menú de usuario, navegación
│   └── ui/         Botones, campos, pestañas, diálogos, estados vacíos y de carga
├── features/
│   ├── auth/       Sesión: login con Google, token, rutas protegidas
│   ├── estado/     Estado general y gráficas
│   ├── records/    Registrar y Consultar (mantenimientos y combustible)
│   └── vehicles/   Vehículos, vehículo activo e intervalos
├── lib/
│   ├── api.ts      Cliente HTTP: agrega el token y traduce los errores
│   ├── queries.ts  Un hook por endpoint y qué datos refrescar después de guardar
│   ├── types.ts    Tipos iguales al JSON del backend
│   ├── format.ts   Millas, dólares y fechas para El Salvador
│   └── forms.ts    Lectura de números ("62,784", "9,5") y errores del backend
└── index.css       Colores (tokens) para modo claro y oscuro
```

**Cómo viajan los datos:** cada pantalla usa un hook de `lib/queries.ts`
(por ejemplo `useVehicleStatus`). TanStack Query guarda la respuesta en caché.
Al registrar o editar algo se invalida todo lo de ese vehículo, y el estado
general, las estadísticas y el historial se actualizan solos.

**Colores:** todos los componentes usan tokens (`bg-surface`, `text-fg-2`,
`bg-good`...) definidos en `index.css`. Por eso el modo oscuro funciona sin
escribir clases extra. La paleta de las gráficas y de los estados está revisada
para daltonismo y contraste.

---

## 4. Instalarla en el teléfono

Una PWA se instala desde el navegador y necesita HTTPS, así que primero publícala (punto 5):
- **Android (Chrome):** abre la URL → menú ⋮ → **Instalar app**.
- **iPhone (Safari):** abre la URL → Compartir → **Agregar a inicio**.

Se abre a pantalla completa como cualquier app y se actualiza sola cuando publicas cambios.

---

## 5. Publicarla (Vercel, gratis)

1. En https://vercel.com → **Add New Project** → importa tu repositorio.
2. **Root Directory:** `frontend` (Vercel detecta Vite solo).
3. Variables de entorno:
   - `VITE_API_URL` = la URL de tu API en Render, por ejemplo `https://smartcar-api.onrender.com`
   - `VITE_GOOGLE_CLIENT_ID` = tu Client ID de Google
4. Cuando tengas la URL de Vercel:
   - Agrégala en `FRONTEND_URL` del backend en Render.
   - Agrégala en **Orígenes de JavaScript autorizados** de Google Cloud.

`vercel.json` ya hace que rutas como `/estado` funcionen al recargar la página.

> La primera petición después de un rato sin uso puede tardar cerca de un minuto:
> el plan gratis de Render apaga la API cuando está inactiva.
