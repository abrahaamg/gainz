import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
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
import OnboardingPage from '../pages/OnboardingPage'
import ProfilePage from '../pages/ProfilePage'
import HistoryPage from '../pages/HistoryPage'
import GlossaryPage from '../pages/GlossaryPage'

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="max-w-7xl mx-auto px-4 py-16 text-center">
    <h1 className="text-2xl font-bold text-gray-700">{title}</h1>
    <p className="text-gray-400 mt-2">Próximamente — en construcción</p>
  </div>
)

const P = (element: React.ReactNode) => (
  <ProtectedRoute>{element}</ProtectedRoute>
)

const router = createBrowserRouter([
  { path: '/login',      element: <LoginPage /> },
  { path: '/register',   element: <RegisterPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },

  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: P(<DashboardPage />) },

      { path: 'exercises',          element: P(<ExercisesPage />) },
      { path: 'exercises/new',      element: P(<ExerciseFormPage />) },
      { path: 'exercises/:id',      element: P(<ExerciseDetailPage />) },
      { path: 'exercises/:id/edit', element: P(<ExerciseFormPage />) },

      { path: 'routines',          element: P(<RoutinesPage />) },
      { path: 'routines/new',      element: P(<RoutineBuilderPage />) },
      { path: 'routines/:id',      element: P(<RoutineDetailPage />) },
      { path: 'routines/:id/edit', element: P(<RoutineBuilderPage />) },

      { path: 'session/:routineId',         element: P(<LiveSessionPage />) },
      { path: 'session/:routineId/summary', element: P(<SessionSummaryPage />) },

      { path: 'equipment',       element: P(<EquipmentPage />) },
      { path: 'recommendations', element: P(<RecommendationsPage />) },

      { path: 'progress', element: P(<ProgressPage />) },
      { path: 'history',  element: P(<HistoryPage />) },
      { path: 'profile',  element: P(<ProfilePage />) },
      { path: 'glossary', element: P(<GlossaryPage />) },

      { path: '*', element: <PlaceholderPage title="404 — Página no encontrada" /> },
    ],
  },
])

export default router
