import { useState } from 'react'
import { Button } from '@bachmain/ui'

/**
 * Multi-step form wizard — Design System 3.0
 * Long forms should not be jammed into one page.
 */
export function FormWizard({
  steps = [],
  initialStep = 0,
  onComplete,
  onCancel,
  className = '',
  completeLabel = 'Kaydet',
}) {
  const [step, setStep] = useState(initialStep)
  const total = steps.length
  const current = steps[step] || {}
  const isFirst = step <= 0
  const isLast = step >= total - 1

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((item, index) => {
          const active = index === step
          const done = index < step
          return (
            <button
              key={item.id || item.title || index}
              type="button"
              onClick={() => setStep(index)}
              className={`inline-flex items-center gap-2 rounded-ds-md border px-3 py-2 text-ds-caption font-semibold transition-colors duration-hover ${
                active
                  ? 'border-ds-primary bg-[color-mix(in_srgb,var(--ds-primary)_12%,transparent)] text-ds-primary'
                  : done
                    ? 'border-ds-border bg-ds-surface text-ds-ink'
                    : 'border-ds-border bg-transparent text-ds-muted'
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ds-surface-muted)] text-ds-caption">
                {index + 1}
              </span>
              <span className="truncate">{item.title}</span>
            </button>
          )
        })}
      </div>

      <div className="rounded-ds-lg border border-ds-border bg-ds-surface p-4 shadow-ds-sm">
        {current.title ? <h3 className="ds-h3 mb-3">{current.title}</h3> : null}
        {typeof current.render === 'function' ? current.render({ step, setStep }) : current.content}
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <div>
          {onCancel ? (
            <Button type="button" variant="cancel" onClick={onCancel}>
              Vazgeç
            </Button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={isFirst} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Geri
          </Button>
          {isLast ? (
            <Button type="button" variant="primary" onClick={() => onComplete?.({ step })}>
              {completeLabel}
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={() => setStep((s) => Math.min(total - 1, s + 1))}>
              İleri
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FormWizard
