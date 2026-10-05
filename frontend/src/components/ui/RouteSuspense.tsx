import { Suspense, type ReactNode } from 'react'
import Spinner from './Spinner'

// Fallback mientras se descarga el chunk de una ruta cargada con React.lazy
export default function RouteSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
