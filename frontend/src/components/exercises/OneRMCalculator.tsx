import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateOneRM, getPercentageTable } from '../../utils/oneRM'

export default function OneRMCalculator() {
  const { t } = useTranslation()
  const [weight, setWeight] = useState<string>('')
  const [reps, setReps]     = useState<string>('')

  const w = parseFloat(weight)
  const r = parseInt(reps, 10)
  const valid = w > 0 && r >= 1 && r <= 30

  const oneRM = useMemo(() => (valid ? calculateOneRM(w, r) : null), [w, r, valid])
  const table  = useMemo(() => (oneRM ? getPercentageTable(oneRM) : []), [oneRM])


  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-neutral-900 tracking-tight mb-0.5">{t('exercises.calculator1RM')}</h2>
      <p className="text-sm font-bold text-neutral-700 mb-1">
        {t('exercises.calculator1RMDesc')}
      </p>
      <p className="text-xs text-neutral-400 uppercase tracking-wider mb-5">
        {t('exercises.calculatorFormula')}
      </p>

      <div className="flex gap-3 mb-5">
        <div className="flex-1">
          <label className="block text-xs text-neutral-400 uppercase tracking-wider mb-1">{t('exercises.weightLabel')}</label>
          <input
            type="number"
            min={1}
            step={0.5}
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder={t('exercises.weightPlaceholder')}
            className="form-input"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-neutral-400 uppercase tracking-wider mb-1">{t('exercises.repsLabel')}</label>
          <input
            type="number"
            min={1}
            max={30}
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder={t('exercises.repsPlaceholder')}
            className="form-input"
          />
        </div>
      </div>

      {oneRM && (
        <>
          <div className="bg-neutral-900 px-4 py-4 mb-4 text-center rounded-2xl">
            <p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">{t('exercises.estimated1RM')}</p>
            <p className="text-5xl font-bold text-accent">{oneRM.toFixed(1)} <span className="text-2xl text-neutral-400">kg</span></p>
          </div>

          <div className="border border-neutral-100 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-400 text-xs uppercase tracking-widest">
                <tr>
                  <th className="text-center px-3 py-2">%</th>
                  <th className="text-right px-3 py-2">{t('exercises.weightLabel')}</th>
                  <th className="text-center px-3 py-2">{t('common.reps')}</th>
                  <th className="text-left px-3 py-2 hidden sm:table-cell">{t('exercises.goalColumn')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {table.map(row => (
                  <tr
                    key={row.pct}
                    className={`${row.pct === 80 ? 'bg-accent/10' : 'hover:bg-neutral-50'}`}
                  >
                    <td className="px-3 py-2 text-center font-bold text-neutral-600">{row.pct}%</td>
                    <td className="px-3 py-2 text-right font-black text-neutral-900">{row.weight}</td>
                    <td className="px-3 py-2 text-center text-neutral-400">{row.repsLabel}</td>
                    <td className="px-3 py-2 text-neutral-400 text-xs uppercase tracking-wide hidden sm:table-cell">{t(`exercises.percentageGoals.${row.goalKey}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!valid && weight !== '' && reps !== '' && (
        <p className="text-xs text-red-400 mt-2 uppercase tracking-wide">{t('exercises.invalidValues')}</p>
      )}
    </div>
  )
}
