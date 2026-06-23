import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createStandaloneProductionJob } from '../utils/productionStore'

export default function ProductionCreatePage() {
  const navigate = useNavigate()

  useEffect(() => {
    const job = createStandaloneProductionJob()
    navigate(`/uretim/${job.id}`, { replace: true })
  }, [navigate])

  return null
}
