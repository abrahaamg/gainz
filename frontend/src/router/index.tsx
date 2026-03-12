import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import ExercisesPage from '../pages/ExercisesPage'
import ExerciseDetailPage from '../pages/ExerciseDetailPage'
import ExerciseFormPage from '../pages/ExerciseFormPage'
import RoutinesPage from '../pages/RoutinesPage'
import RoutineDetailPage from '../pages/RoutineDetailPage'
import RoutineBuilderPage from '../pages/RoutineBuilderPage'

// Placeholder pages para módulos futuros
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="max-w-7xl mx-auto px-4 py-16 text-center">
    <h1 className="text-2xl font-bold text-gray-700">{title}</h1>
    <p className="text-gray-400 mt-2">Próximamente — en construcción</p>
  </div>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <PlaceholderPage title="🏠 Dashboard" /> },

      // Módulo 1 — Ejercicios
      { path: 'exercises',          element: <ExercisesPage /> },
      { path: 'exercises/new',      element: <ExerciseFormPage /> },
      { path: 'exercises/:id',      element: <ExerciseDetailPage /> },
      { path: 'exercises/:id/edit', element: <ExerciseFormPage /> },

      // Módulo 2 — Rutinas
      { path: 'routines',              element: <RoutinesPage /> },
      { path: 'routines/new',          element: <RoutineBuilderPage /> },
      { path: 'routines/:id',          element: <RoutineDetailPage /> },
      { path: 'routines/:id/edit',     element: <RoutineBuilderPage /> },

      // Módulo 3 — Sesión (placeholder)
      { path: 'session/:routineId',         element: <PlaceholderPage title="⚡ Sesión en vivo" /> },
      { path: 'session/:routineId/summary', element: <PlaceholderPage title="Resumen de sesión" /> },

      // Módulo 4 — Equipamiento (placeholder)
      { path: 'equipment',       element: <PlaceholderPage title="🏋️ Equipamiento" /> },
      { path: 'recommendations', element: <PlaceholderPage title="⭐ Recomendaciones" /> },

      // Módulo 5 — Progreso (placeholder)
      { path: 'progress', element: <PlaceholderPage title="📈 Progreso" /> },

      // 404
      { path: '*', element: <PlaceholderPage title="404 — Página no encontrada" /> },
    ],
  },
])

export default router
