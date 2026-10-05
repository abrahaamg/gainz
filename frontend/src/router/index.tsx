import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import GuestRoute from '../components/auth/GuestRoute'
import RouteSuspense from '../components/ui/RouteSuspense'
import RouteError from '../components/ui/RouteError'

// Cada página es un chunk aparte: recharts, framer-motion, dnd-kit... no entran en el bundle inicial
const LoginPage = lazy(() => import('../pages/LoginPage'))
const RegisterPage = lazy(() => import('../pages/RegisterPage'))
const OnboardingPage = lazy(() => import('../pages/OnboardingPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const ExercisesPage = lazy(() => import('../pages/ExercisesPage'))
const ExerciseDetailPage = lazy(() => import('../pages/ExerciseDetailPage'))
const ExerciseFormPage = lazy(() => import('../pages/ExerciseFormPage'))
const RoutinesPage = lazy(() => import('../pages/RoutinesPage'))
const RoutineDetailPage = lazy(() => import('../pages/RoutineDetailPage'))
const RoutineBuilderPage = lazy(() => import('../pages/RoutineBuilderPage'))
const LiveSessionPage = lazy(() => import('../pages/LiveSessionPage'))
const SessionSummaryPage = lazy(() => import('../pages/SessionSummaryPage'))
const EquipmentPage = lazy(() => import('../pages/EquipmentPage'))
const RecommendationsPage = lazy(() => import('../pages/RecommendationsPage'))
const ProgressPage = lazy(() => import('../pages/ProgressPage'))
const HistoryPage = lazy(() => import('../pages/HistoryPage'))
const ProfilePage = lazy(() => import('../pages/ProfilePage'))
const GlossaryPage = lazy(() => import('../pages/GlossaryPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

const guest = (element: React.ReactNode) => (
  <RouteSuspense><GuestRoute>{element}</GuestRoute></RouteSuspense>
)

const protect = (element: React.ReactNode) => (
  <ProtectedRoute>{element}</ProtectedRoute>
)

const router = createBrowserRouter([
  { path: '/login',    element: guest(<LoginPage />),    errorElement: <RouteError /> },
  { path: '/register', element: guest(<RegisterPage />), errorElement: <RouteError /> },
  {
    // Solo exige sesión: es la ruta a la que se redirige cuando falta el onboarding
    path: '/onboarding',
    element: (
      <RouteSuspense>
        <ProtectedRoute allowIncompleteOnboarding><OnboardingPage /></ProtectedRoute>
      </RouteSuspense>
    ),
    errorElement: <RouteError />,
  },

  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      {
        // Ruta sin path: los errores de una página se muestran dentro del Layout (con navbar)
        errorElement: <RouteError />,
        children: [
          { index: true, element: protect(<DashboardPage />) },

          { path: 'exercises',          element: protect(<ExercisesPage />) },
          { path: 'exercises/new',      element: protect(<ExerciseFormPage />) },
          { path: 'exercises/:id',      element: protect(<ExerciseDetailPage />) },
          { path: 'exercises/:id/edit', element: protect(<ExerciseFormPage />) },

          { path: 'routines',          element: protect(<RoutinesPage />) },
          { path: 'routines/new',      element: protect(<RoutineBuilderPage />) },
          { path: 'routines/:id',      element: protect(<RoutineDetailPage />) },
          { path: 'routines/:id/edit', element: protect(<RoutineBuilderPage />) },

          { path: 'session/:routineId',          element: protect(<LiveSessionPage />) },
          { path: 'session/:sessionId/summary',  element: protect(<SessionSummaryPage />) },

          { path: 'equipment',       element: protect(<EquipmentPage />) },
          { path: 'recommendations', element: protect(<RecommendationsPage />) },

          { path: 'progress', element: protect(<ProgressPage />) },
          { path: 'history',  element: protect(<HistoryPage />) },
          { path: 'profile',  element: protect(<ProfilePage />) },
          { path: 'glossary', element: protect(<GlossaryPage />) },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

export default router
