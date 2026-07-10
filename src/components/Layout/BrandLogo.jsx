import bachmainLogo from '../../assets/bachmain-logo.png'

export default function BrandLogo({ collapsed = false, className = '' }) {
  return (
    <div className={`brand-logo ${collapsed ? 'brand-logo-collapsed' : ''} ${className}`.trim()}>
      <img
        src={bachmainLogo}
        alt="BACHMAIN"
        className={`brand-logo-img ${collapsed ? 'brand-logo-img-collapsed' : ''}`}
        draggable={false}
      />
    </div>
  )
}
