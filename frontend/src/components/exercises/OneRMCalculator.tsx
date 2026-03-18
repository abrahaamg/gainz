import { useState, useMemo } from 'react'
import { calculateOneRM, getPercentageTable } from '../../utils/oneRM'

export default function OneRMCalculator() {
  const [weight, setWeight] = useState<string>('')
  const [reps, setReps]     = useState<string>('')

  const w = parseFloat(weight)
  const r = parseInt(reps, 10)
  const valid = w > 0 && r >= 1 && r <= 30

  const oneRM = useMemo(() => (valid ? calculateOneRM(w, r) : null), [w, r, valid])
  const table  = useMemo(() => (oneRM ? getPercentageTable(oneRM) : []), [oneRM])

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Calculadora 1RM</h2>
      <p className="text-xs text-gray-400 mb-4">Fórmula de Epley — introduce un esfuerzo conocido</p>

      {/* Inputs */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Peso (kg)</label>
          <input
            type="number"
            min={1}
            step={0.5}
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="ej. 80"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Repeticiones</label>
          <input
            type="number"
            min={1}
            max={30}
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder="ej. 8"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* Result */}
      {oneRM && (
        <>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4 text-center">
            <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">1RM estimado</p>
            <p className="text-4xl font-black text-indigo-700 mt-0.5">{oneRM.toFixed(1)} kg</p>
          </div>

          {/* Percentage table */}
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-center px-3 py-2">%</th>
                  <th className="text-right px-3 py-2">Peso (kg)</th>
                  <th className="text-center px-3 py-2">Reps</th>
                  <th className="text-left px-3 py-2 hidden sm:table-cell">Objetivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {table.map(row => (
                  <tr
                    key={row.pct}
                    className={`hover:bg-gray-50 ${row.pct === 80 ? 'bg-indigo-50/60' : ''}`}
                  >
                    <td className="px-3 py-2 text-center font-semibold text-gray-600">{row.pct}%</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-900">{row.weight}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{row.repsLabel}</td>
                    <td className="px-3 py-2 text-gray-400 text-xs hidden sm:table-cell">{row.goal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!valid && weight !== '' && reps !== '' && (
        <p className="text-xs text-red-400 mt-1">Introduce valores válidos (peso &gt; 0, reps 1–30)</p>
      )}
    </div>
  )
}
