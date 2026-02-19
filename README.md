# CVA Deportes — Sistema de Gestión de Secretaría de Deportes

Aplicación web para la gestión de actividades deportivas del CVA.

## Stack Tecnológico

- **Frontend/Backend:** Next.js 14 (App Router) + TypeScript
- **Base de datos:** SQLite via Prisma ORM
- **Autenticación:** NextAuth.js v4 con JWT
- **UI:** Tailwind CSS
- **Calendario:** react-big-calendar
- **Kanban:** @hello-pangea/dnd (drag & drop)

## Módulos

### 1. Calendario de Eventos
- Visualización mensual/semanal/diaria de todos los eventos
- Creación de eventos por disciplina (comités solo su disciplina)
- Gestión de estado: Planificado, En Progreso, Completado, Cancelado, Postergado
- Comentarios por evento
- Carga de imágenes y flyers
- Checklist de verificación para la trabajadora de sociales

### 2. Requerimientos
- Cada disciplina puede cargar sus solicitudes
- Prioridad: Alta, Media, Baja
- Categorías: Implementos, Insumos, Equipamiento, Infraestructura
- Fecha estimada de adquisición, cantidad y unidad
- Estados: Pendiente, En Proceso, Adquirido, Cancelado

### 3. Tareas (Kanban) — Solo Admin y Trabajadora
- Tablero Kanban con columnas: Por Hacer | En Progreso | Para Revisar | Completada
- El Admin crea tareas y las asigna a la trabajadora
- Drag & drop entre columnas
- Fecha límite y prioridad por tarea

### 4. Dashboard
- Estadísticas de eventos del mes
- Próximos eventos
- Requerimientos de alta prioridad
- Gráficos de estado de eventos y requerimientos

## Disciplinas Disponibles

Tenis, Tenis de Mesa, Pickleball, Padel, Natación, Futbolito, Bailoterapia, Xtreme Bike, Gimnasio, Funcionales, Bolas Criollas, Dominó, Barajas, Pilates

## Roles

| Rol | Acceso |
|-----|--------|
| **Admin** | Todos los módulos, creación de tareas |
| **Trabajadora de Sociales** | Todos los módulos, gestión del checklist, mover tareas |
| **Comité** | Calendario + Requerimientos (solo su disciplina) |

## Instalación y Uso

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma y crear BD
npm run db:push

# Cargar datos iniciales
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

## Credenciales de Acceso (Seed)

| Usuario | Email | Contraseña |
|---------|-------|------------|
| Administrador | admin@cva.com | admin123 |
| Trabajadora | social@cva.com | social123 |
| Comité Tenis | tenis@cva.com | comite123 |
| Comité Natación | natacion@cva.com | comite123 |
| Comité Pilates | pilates@cva.com | comite123 |
| *(otros comités)* | `<disciplina>`@cva.com | comite123 |

## Variables de Entorno

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-seguro"
```
