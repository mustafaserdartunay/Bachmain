const BUTTONS = [
  { id: 'normal', label: 'Normal' },
  { id: 'satellite', label: 'Uydu' },
  { id: 'traffic', label: 'Trafik' },
  { id: 'fit', label: 'Tüm rotayı göster' },
  { id: 'focusTruck', label: 'Araca odaklan' },
  { id: 'stops', label: 'Teslimatları göster' },
  { id: 'history', label: 'Geçmiş rotayı göster' },
  { id: 'fullscreen', label: 'Tam ekran' },
]

export default function TruckMapControls({
  mapType,
  traffic,
  showStops,
  showHistory,
  fullscreen,
  hasGps,
  hasHistory,
  onAction,
}) {
  return (
    <div className="tcc-map-controls">
      {BUTTONS.map((btn) => {
        let active = false
        if (btn.id === 'normal') active = mapType === 'roadmap'
        if (btn.id === 'satellite') active = mapType === 'hybrid'
        if (btn.id === 'traffic') active = traffic
        if (btn.id === 'stops') active = showStops
        if (btn.id === 'history') active = showHistory
        if (btn.id === 'fullscreen') active = fullscreen
        if (btn.id === 'focusTruck' && !hasGps) return null
        if (btn.id === 'history' && !hasHistory) return null
        return (
          <button
            key={btn.id}
            type="button"
            className={`tcc-chip ${active ? 'is-active' : ''}`}
            onClick={() => onAction(btn.id)}
          >
            {btn.id === 'fullscreen' && fullscreen ? 'Küçült' : btn.label}
          </button>
        )
      })}
    </div>
  )
}
