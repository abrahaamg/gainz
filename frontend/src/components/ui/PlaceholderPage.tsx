import { useTranslation } from 'react-i18next'

export default function PlaceholderPage({ title }: { title: string }) {
  const { t } = useTranslation()
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-700">{title}</h1>
      <p className="text-gray-400 mt-2">{t('common.comingSoon')}</p>
    </div>
  )
}
