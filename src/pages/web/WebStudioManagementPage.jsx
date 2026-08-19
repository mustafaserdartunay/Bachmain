import { useEffect } from 'react'
import { startStudioJump } from '../../utils/dropelyaStudio'

export default function WebStudioManagementPage() {
  useEffect(() => {
    startStudioJump()
  }, [])

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-[#203375]">Studio yönetim modülü açılıyor…</p>
    </div>
  )
}
