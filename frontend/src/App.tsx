import { RouterProvider } from 'react-router-dom'
import router from './router'
import { useAuthInit } from './hooks/useAuth'

function AppInner() {
  useAuthInit()
  return <RouterProvider router={router} />
}

export default function App() {
  return <AppInner />
}
