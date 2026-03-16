import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import ExercisesPage from '../pages/ExercisesPage'
import ExerciseDetailPage from '../pages/ExerciseDetailPage'
import ExerciseFormPage from '../pages/ExerciseFormPage'
import RoutinesPage from '../pages/RoutinesPage'
import RoutineDetailPage from '../pages/RoutineDetailPage'
import RoutineBuilderPage from '../pages/RoutineBuilderPage'
import LiveSessionPage from '../pages/LiveSessionPage'
import SessionSummaryPage from '../pages/SessionSummaryPage'
import EquipmentPage from '../pages/EquipmentPage'
import RecommendationsPage from '../pages/RecommendationsPage'
import ProgressPage from '../pages/ProgressPage'
import DashboardPage from '../pages/DashboardPage'

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
      { index: true, element: <DashboardPage /> },

      { path: 'exercises',          element: <ExercisesPage /> },
      { path: 'exercises/new',      element: <ExerciseFormPage /> },
      { path: 'exercises/:id',      element: <ExerciseDetailPage /> },
      { path: 'exercises/:id/edit', element: <ExerciseFormPage /> },

      { path: 'routines',          element: <RoutinesPage /> },
      { path: 'routines/new',      element: <RoutineBuilderPage /> },
      { path: 'routines/:id',      element: <RoutineDetailPage /> },
      { path: 'routines/:id/edit', element: <RoutineBuilderPage /> },

      { path: 'session/:routineId',         element: <LiveSessionPage /> },
      { path: 'session/:routineId/summary', element: <SessionSummaryPage /> },

      { path: 'equipment',       element: <EquipmentPage /> },
      { path: 'recommendations', element: <RecommendationsPage /> },

      { path: 'progress', element: <ProgressPage /> },

      { path: '*', element: <PlaceholderPage title="404 — Página no encontrada" /> },
    ],
  },
])

export default router
