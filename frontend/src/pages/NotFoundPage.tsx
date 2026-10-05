import { useTranslation } from 'react-i18next'
import PlaceholderPage from '../components/ui/PlaceholderPage'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return <PlaceholderPage title={t('common.notFound')} />
}
