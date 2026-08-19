import { useEffect } from 'react'
import { startStudioJump } from '../../utils/dropelyaStudio'

export default function WebStudioManagementPage() {
  useEffect(() => {
    startStudioJump()
  }, [])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#e8eef6]">
      <p className="text-sm font-semibold text-[#203375]">Studio yönetim açılıyor…</p>
    </div>
  )
}
