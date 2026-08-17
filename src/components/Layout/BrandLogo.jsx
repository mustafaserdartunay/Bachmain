import bachmainLogo from '../../assets/bachmain-logo.png'
import BachMainMascot from './BachMainMascot'

export default function BrandLogo({ collapsed = false, className = '' }) {
  return (
    <div
      className={`brand-logo brand-logo-with-mascot ${collapsed ? 'brand-logo-collapsed' : ''} ${className}`.trim()}
    >
      <BachMainMascot collapsed={collapsed} />
      <img
        src={bachmainLogo}
        alt="BACHMAIN"
        className={`brand-logo-img ${collapsed ? 'brand-logo-img-collapsed' : ''}`}
        draggable={false}
      />
    </div>
  )
}
