import { useAsync } from './useAsync'
import { exerciseService } from '../services/exerciseService'
import type { Exercise } from '../types/exercise'

const PAGE_SIZE = 100

/** Catálogo completo de ejercicios (todas las páginas), para selectores con búsqueda local. */
export async function fetchAllExercises(): Promise<Exercise[]> {
  const all: Exercise[] = []
  for (let page = 1; ; page++) {
    const res = await exerciseService.getAll({ page, limit: PAGE_SIZE })
    all.push(...res.data)
    if (!res.pagination?.hasNext) return all
  }
}

export function useExerciseCatalog() {
  const { data, loading, error, reload, setData } = useAsync(fetchAllExercises, [])
  return {
    catalog: data ?? [],
    loading,
    error,
    reload,
    /** Añade al catálogo local un ejercicio recién creado. */
    addToCatalog: (ex: Exercise) => setData(prev => [...(prev ?? []), ex]),
  }
}
