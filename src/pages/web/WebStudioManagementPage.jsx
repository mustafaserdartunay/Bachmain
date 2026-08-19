import { useLocation } from 'react-router-dom'
import { dropelyaPathForStudio, getDropelyaPageUrl } from '../../utils/dropelyaStudio'

export default function WebStudioManagementPage() {
  const { pathname } = useLocation()
  const src = getDropelyaPageUrl(dropelyaPathForStudio(pathname))

  return (
    <iframe
      title="Studio Yönetim"
      src={src}
      className="block h-[calc(100dvh-(2*var(--shell-gap)))] min-h-[36rem] w-full border-0 bg-[#eef0f4]"
    />
  )
}
