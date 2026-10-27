# SmartCar · Backend (Flask)

API REST de SmartCar: login con Google, vehículos, mantenimientos, cargas de
combustible, estado general y estadísticas de rendimiento.

**Tecnologías:** Flask 3 · SQLAlchemy 2 · PostgreSQL · Flask-Migrate ·
Flask-JWT-Extended · google-auth · marshmallow · pytest

---

## 1. Arquitectura

Arquitectura en capas: cada una tiene un solo trabajo y solo conoce a la de abajo.

```
Petición HTTP
   │
   ▼
routes/         Capa web: lee la petición, valida con schemas/ y responde con serializers.py
   │
   ▼
services/       Casos de uso y reglas de negocio. No saben nada de HTTP ni de Flask
   │            (lanzan errores de domain/errors.py, controlan su transacción)
   ▼
repositories/   Acceso a datos: consultas SQL, sin commit
   │
   ▼
models/         Tablas (SQLAlchemy 2)
```

### Patrones y por qué se usan

| Patrón | Dónde | Para qué |
|---|---|---|
| **Application Factory** | `app/__init__.py` | Crear la app con distinta configuración (producción, pruebas con SQLite en memoria). |
| **Repository** (genérico) | `repositories/base.py`, `record_repository.py` | Aislar las consultas. Mantenimientos y combustible comparten la misma consulta del odómetro. |
| **Unit of Work** | `repositories/unit_of_work.py` | El servicio decide cuándo se confirma: un caso de uso con varios pasos se guarda completo o no se guarda nada. |
| **Service Layer** | `services/` | Las reglas de negocio viven en un solo lugar, sin depender de HTTP. |
| **Inyección de dependencias** + raíz de composición | `container.py` | Cada servicio recibe sus repositorios por constructor. Las pruebas arman servicios con repositorios falsos, sin base de datos (`tests/test_services_unit.py`). |
| **Errores de dominio** | `domain/errors.py` → `errors.py` | Los servicios lanzan `NotFoundError` u `OdometerConflictError`; solo la capa web los traduce a 404 o 400. |
| **Read model** | `services/dashboard_service.py` | El estado general y las estadísticas son consultas de solo lectura armadas para la pantalla. |
| **Núcleo funcional** | `services/calculations.py` | Los cálculos (estado, MPG, costos) son funciones puras, fáciles de probar. |
| **DTO de entrada / salida** | `schemas/` y `serializers.py` | Validar lo que entra y dar formato a lo que sale, sin mezclarlo con los modelos. |

### Carpetas

```
backend/
├── app/
│   ├── __init__.py         create_app(): arma la aplicación
│   ├── container.py        Crea y conecta repositorios y servicios (inyección de dependencias)
│   ├── config.py           Lee la configuración del archivo .env
│   ├── extensions.py       db, migrate, jwt, cors
│   ├── security.py         Mensajes de error del token y current_user
│   ├── errors.py           Traduce errores a JSON {"msg": ...} con su código HTTP
│   ├── serializers.py      Formato JSON de cada modelo
│   ├── commands.py         flask dev-token y flask seed-demo
│   ├── domain/             Errores de negocio
│   ├── models/             User, Vehicle, MaintenanceRecord, FuelLog, MaintenanceInterval
│   ├── schemas/            Validación de datos de entrada (marshmallow)
│   ├── repositories/       Consultas SQL y Unit of Work
│   ├── services/           Casos de uso: auth, vehículos, registros, intervalos, estado
│   └── routes/             Endpoints (blueprints)
├── migrations/             Historial de cambios de la base de datos (Alembic)
├── tests/                  Pruebas unitarias (sin base de datos) y de integración (API completa)
├── api.http                Peticiones de ejemplo para probar la API
├── pyproject.toml          Configuración de ruff (estilo y errores comunes)
├── .env.example            Plantilla de configuración
└── wsgi.py                 Punto de entrada
```

---

## 2. Correrlo en tu computadora (Windows)

### 2.1 Requisitos
- Python 3.11 o superior
- PostgreSQL. Tienes dos opciones:
  - Instalador: https://www.postgresql.org/download/windows/
  - Docker:
    ```powershell
    docker run --name smartcar-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=smartcar -p 5432:5432 -d postgres:16
    ```
  Si usaste el instalador, crea la base con `CREATE DATABASE smartcar;` en pgAdmin o psql.

### 2.2 Instalar
```powershell
cd SmartCar\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements-dev.txt
copy .env.example .env
```

Abre `.env` y completa:
- `DATABASE_URL`: tu conexión a PostgreSQL.
- `JWT_SECRET_KEY`: genera una con `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
- `GOOGLE_CLIENT_ID`: lo obtienes en el punto 3. Para probar con `dev-token` todavía no lo necesitas.

### 2.3 Crear las tablas y arrancar
```powershell
flask db upgrade        # crea las tablas
flask run --debug       # http://127.0.0.1:5000/api/health
```

### 2.4 Probar sin frontend
Google entrega el token de login desde el navegador. Para probar la API antes de
tener el frontend, usa estos comandos:

```powershell
flask seed-demo tu_correo@gmail.com   # crea un Corolla con un año de datos
flask dev-token tu_correo@gmail.com   # muestra un token para usar la API
```

Luego abre `api.http` en VS Code con la extensión **REST Client**, pega el token
y pulsa "Send Request" en cada petición. También puedes usar Postman con el
header `Authorization: Bearer <token>`.

### 2.5 Pruebas automáticas y estilo
```powershell
pytest        # 49 pruebas: unitarias e integración
ruff check .  # estilo y errores comunes
```

---

## 3. Configurar el login con Google

1. Entra a https://console.cloud.google.com y crea un proyecto llamado **SmartCar**.
2. Abre **Google Auth Platform** (antes "Pantalla de consentimiento de OAuth").
   Pon el nombre de la app y tu correo de soporte, y elige el público **Externo**.
3. En **Público** agrega tu correo como usuario de prueba. Cuando quieras que
   cualquiera pueda entrar, pulsa **Publicar app**. Con los permisos básicos
   (correo y perfil) Google no pide verificación.
4. En **Clientes** crea un cliente de tipo **Aplicación web**. En
   **Orígenes de JavaScript autorizados** agrega:
   - `http://localhost`
   - `http://localhost:5173`
   - Más adelante, la URL de tu frontend publicado.
5. Copia el **ID de cliente** en `GOOGLE_CLIENT_ID` del `.env`. El frontend usará
   el mismo ID. Para este flujo no se necesita el client secret.

**Cómo funciona el login**

```
Frontend                      Backend (POST /api/auth/google)            Google
   │ botón "Acceder con Google"                                             │
   │──────────────────────────────────────────────────────────────────────>│
   │<─────────────────────── credential (token firmado) ───────────────────│
   │── { credential } ──────────>│ 1. Verifica firma, vigencia y Client ID
   │                             │ 2. Busca el correo; si no existe lo registra
   │<── { access_token, user } ──│ 3. Devuelve un JWT propio de SmartCar
   │                                 (se envía en cada petición: Authorization: Bearer ...)
```

---

## 4. Endpoints

Todas las rutas, salvo `health`, `maintenance-types` y `auth/google`, requieren el header
`Authorization: Bearer <token>`. Un usuario solo puede ver y modificar sus propios vehículos.

| Método | Ruta | Para qué |
|---|---|---|
| GET | `/api/health` | Comprobar que la API y la base de datos responden |
| POST | `/api/auth/google` | Login: `{"credential": "..."}` → `{access_token, user, new_user}` |
| GET | `/api/auth/me` | Datos del usuario actual |
| GET · POST | `/api/vehicles` | Listar · registrar vehículo |
| GET · PUT · DELETE | `/api/vehicles/{id}` | Ver · editar · borrar (borra también sus registros) |
| GET | `/api/maintenance-types` | Tipos de mantenimiento con su nombre en español |
| GET · POST | `/api/vehicles/{id}/maintenance` | Consultar (`?type=&from=&to=`) · registrar mantenimiento |
| GET · PUT · DELETE | `/api/maintenance/{id}` | Ver · editar · borrar mantenimiento |
| GET · POST | `/api/vehicles/{id}/fuel` | Consultar (`?from=&to=`) · registrar carga de combustible |
| GET · PUT · DELETE | `/api/fuel/{id}` | Ver · editar · borrar carga |
| GET | `/api/vehicles/{id}/status` | **Estado general** (semáforo por componente) |
| GET | `/api/vehicles/{id}/stats` | **Rendimiento**: MPG, gastos y comparativas |
| GET · PUT | `/api/vehicles/{id}/intervals` | Ver · personalizar cada cuánto toca cada mantenimiento |
| DELETE | `/api/vehicles/{id}/intervals/{tipo}` | Volver al intervalo sugerido |

En los `PUT` basta con enviar los campos que cambian.

**Ejemplos de datos**

```jsonc
// POST /api/vehicles
{ "make": "Toyota", "model": "Corolla", "year": 2018, "plate": "P123-456", "initial_mileage": 45000 }

// POST /api/vehicles/1/maintenance
// type: oil_change | air_filter | cabin_filter | spark_plugs | brake_pads | battery
{ "type": "oil_change", "date": "2026-10-01", "mileage": 48500, "cost": 45.00, "notes": "5W-30 sintético" }

// POST /api/vehicles/1/fuel   (full_tank: ¿llenaste el tanque?)
{ "date": "2026-10-05", "mileage": 48790, "gallons": 9.8, "total_cost": 39.50, "full_tank": true }

// PUT /api/vehicles/1/intervals
[{ "type": "oil_change", "every_miles": 7500, "every_months": 6 }]
```

**Errores**: siempre `{"msg": "..."}`. Los errores de validación (400) traen
además `errors` con el detalle por campo.

---

## 5. Reglas y cálculos

**El odómetro solo avanza.** Al registrar o editar, un registro con fecha
posterior no puede tener menos millas que uno anterior. Se compara contra
mantenimientos y cargas de combustible del mismo vehículo.

**Estado de cada componente** (`/status`). Se mide el avance del intervalo por
millas y por tiempo, y manda el más avanzado:

| Avance | Estado |
|---|---|
| menos de 80 % | `al_dia` |
| 80 % a 99 % | `proximo` |
| 100 % o más | `vencido` |
| sin registros | `sin_registro` |

Intervalos sugeridos (se pueden cambiar por vehículo según el manual):

| Componente | Millas | Meses |
|---|---|---|
| Cambio de aceite | 5,000 | 6 |
| Filtro de aire | 15,000 | 12 |
| Filtro de cabina | 15,000 | 12 |
| Bujías | 60,000 | 60 |
| Pastillas de freno | 30,000 | 36 |
| Batería | — | 48 |

**Rendimiento (MPG), de tanque lleno a tanque lleno.** Entre dos cargas con el
tanque lleno: millas recorridas ÷ galones cargados. Si una carga fue parcial
(`full_tank: false`), sus galones se suman a la siguiente carga llena. Por eso
conviene llenar el tanque siempre que se pueda.

**Comparar rendimientos** (`/stats`):
- `fuel.mpg_series`: MPG de cada tramo, para graficarlo en el tiempo.
- `maintenance_impact`: MPG promedio de hasta 3 tramos antes y 3 después de cada
  mantenimiento, por ejemplo para ver si el carro rinde más con bujías nuevas. Si dos
  mantenimientos están muy cerca, la comparación los mezcla.
- `maintenance_cycles`: cuántas millas y días duró cada cambio.
- `costs.by_month`: gasto mensual en mantenimiento y combustible.
- `fuel.cost_per_mile`: cuánto cuesta en combustible recorrer una milla.

---

## 6. Cambios futuros en la base de datos

Si agregas o cambias un modelo:

```powershell
flask db migrate -m "describe el cambio"   # genera la migración en migrations/versions
flask db upgrade                           # la aplica
```

Revisa el archivo generado antes de aplicarlo.

---

## 7. Publicarlo en internet (gratis)

1. **Base de datos (Neon o Supabase):** crea un proyecto PostgreSQL y copia la cadena de
   conexión. Va tal cual en `DATABASE_URL`; la app la adapta sola.
2. **API (Render)**: la forma más rápida es *New → Blueprint* y elegir el repositorio; `render.yaml` ya trae todo y solo te pide las variables. A mano sería *New Web Service* con:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt && flask db upgrade`
   - Start Command: `gunicorn wsgi:app`
   - Health Check Path: `/api/health`
   - Variables: `DATABASE_URL`, `JWT_SECRET_KEY`, `GOOGLE_CLIENT_ID` y
     `FRONTEND_URL` (la URL del frontend publicado; puedes poner varias separadas por comas)
3. Agrega la URL del frontend publicado en los orígenes autorizados de Google (punto 3).

En el plan gratis, Render apaga la API cuando no se usa. La primera petición
después de un rato puede tardar cerca de un minuto.

---

## 8. El frontend

La app web (React como PWA) que consume esta API está en [`../frontend`](../frontend/README.md).
