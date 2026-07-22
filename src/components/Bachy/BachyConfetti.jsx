import { useEffect, useState } from 'react'

const COLORS = ['#5c3d2e', '#b87333', '#79a6d2', '#22c55e', '#f59e0b', '#ec4899']

export default function BachyConfetti({ active }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!active) {
      setPieces([])
      return undefined
    }
    const next = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      color: COLORS[i % COLORS.length],
      rot: Math.random() * 360,
    }))
    setPieces(next)
    const t = setTimeout(() => setPieces([]), 1600)
    return () => clearTimeout(t)
  }, [active])

  if (!pieces.length) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 h-2 w-2 animate-[bachy-confetti_1.4s_ease-out_forwards] rounded-sm"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes bachy-confetti {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(120px) rotate(240deg); }
        }
      `}</style>
    </div>
  )
}
