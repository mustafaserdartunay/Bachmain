import bachmainMascot from '../../assets/bachmain-mascot-suit.png'

export default function BachMainMascot({ className = '', collapsed = false }) {
  if (collapsed) return null

  return (
    <span
      className={`bachmain-mascot-wrap inline-flex shrink-0 items-end ${className}`.trim()}
      aria-hidden
    >
      <img
        src={bachmainMascot}
        alt=""
        className="bachmain-mascot"
        draggable={false}
        loading="eager"
        decoding="async"
      />
    </span>
  )
}
