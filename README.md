# SmartCar 🚗

App para registrar tus vehículos y llevar el control de sus mantenimientos y
del consumo de combustible. Funciona en la computadora y en el teléfono con la
misma base de datos, y se entra con la cuenta de Google.

**Secciones de la app**

- **Registrar**: vehículos, cambios de aceite, filtros de aire y de cabina,
  bujías, pastillas de freno, batería y cargas de combustible (con millas y fecha).
- **Consultar**: historial con filtros por tipo y fechas; editar y borrar.
- **Estado general**: semáforo de cada componente (al día, próximo, vencido),
  rendimiento en millas por galón y comparación antes y después de cada mantenimiento.

## Arquitectura

```
PWA en la PC ─┐
              ├── HTTPS ──> API Flask ──> PostgreSQL
PWA en el cel ┘            (Render)      (Neon / Supabase)
```

| Carpeta | Tecnología | Estado |
|---|---|---|
| [`backend/`](backend/) | Flask, SQLAlchemy, JWT, login con Google | ✅ Listo |
| `frontend/` | React + Vite + TypeScript como PWA | Próximo paso |

La guía paso a paso del backend está en [backend/README.md](backend/README.md).
