import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { dropelyaPathForStudio, getDropelyaPageUrl } from '../../utils/dropelyaStudio'

export default function WebStudioManagementPage() {
  const { pathname } = useLocation()
  const src = getDropelyaPageUrl(dropelyaPathForStudio(pathname))
  const mixed =
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    src.startsWith('http://')

  useEffect(() => {
    if (mixed) window.location.assign(src)
  }, [mixed, src])

  if (mixed) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center text-sm font-semibold text-[#203375]">
        Studio yönetim açılıyor…
      </div>
    )
  }

  return (
    <iframe
      title="Studio Yönetim"
      src={src}
      className="block h-[calc(100dvh-(2*var(--shell-gap)))] min-h-[36rem] w-full border-0 bg-[#eef0f4]"
    />
  )
}
