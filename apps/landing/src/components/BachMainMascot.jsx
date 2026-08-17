import OptimizedImage from './seo/OptimizedImage'

const MASCOT_SRC = '/assets/bachmain-mascot-suit.png'

export default function BachMainMascot({ className = '' }) {
  return (
    <span
      className={`bachmain-mascot-wrap inline-flex shrink-0 items-end ${className}`.trim()}
      aria-hidden
    >
      <OptimizedImage
        src={MASCOT_SRC}
        alt=""
        width={120}
        height={160}
        className="bachmain-mascot"
        priority
        draggable={false}
      />
    </span>
  )
}
