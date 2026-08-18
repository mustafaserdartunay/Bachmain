import { useState } from 'react'
import { GripVertical, MousePointerClick, Type, PanelsTopLeft } from 'lucide-react'
import { FormSectionPanel } from '../components/Common/FormSectionPanel'
import {
  GIFT_BANNER_PRESETS,
  GIFT_EDITOR_BLOCKS,
  GIFT_FONT_PRESETS,
  normalizeGiftDesign,
} from './giftDesignPresets'
import { applyWebTemplateDesign, getWebTemplate } from '../utils/webTemplateStorage'
import './gift-storefront.css'

function startDrag(event, token) {
  event.dataTransfer.setData('text/plain', token)
  event.dataTransfer.effectAllowed = 'copy'
}

function ModuleCard({ token, active, label, hint, sample, sampleStyle, onApply }) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => startDrag(event, token)}
      onClick={onApply}
      className={`group flex w-full items-stretch gap-2 rounded-2xl border px-2.5 py-2 text-left transition ${
        active
          ? 'border-[#1f3f66] bg-[#1f3f66]/6 shadow-[0_0_0_1px_rgba(31,63,102,0.12)]'
          : 'border-[var(--line)] bg-white hover:border-[#c9ad8a]'
      }`}
    >
      <span className="mt-0.5 text-[var(--muted)] group-hover:text-[#1f3f66]">
        <GripVertical className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-black text-[var(--ink)]">{label}</span>
        <span className="mt-0.5 block text-[11px] font-semibold text-[var(--muted)]">{hint}</span>
        {sample ? (
          <span className="mt-1.5 block truncate text-[15px] font-extrabold text-[#1f3f66]" style={sampleStyle}>
            {sample}
          </span>
        ) : (
          <span className={`mt-1.5 block h-8 overflow-hidden rounded-lg ${token.replace('banner:', 'sf-banner-thumb-')}`} />
        )}
      </span>
    </button>
  )
}

export default function GiftStorefrontDesigner({ selectedBlock, onSelectBlock }) {
  const [tick, setTick] = useState(0)
  const design = normalizeGiftDesign(getWebTemplate().design)
  const block = GIFT_EDITOR_BLOCKS.find((item) => item.id === selectedBlock) || GIFT_EDITOR_BLOCKS[2]
  void tick

  function apply(patch) {
    applyWebTemplateDesign(patch)
    setTick((n) => n + 1)
  }

  return (
    <aside className="space-y-4 xl:sticky xl:top-3">
      <FormSectionPanel icon={MousePointerClick} title="Sürükle & bırak" compact>
        <p className="px-1 text-[12px] font-semibold leading-relaxed text-[var(--muted)]">
          Vitrinde bir alana gelin, tıklayıp seçin. Sağdaki kartı sürükleyip bırakın veya tıklayarak uygulayın. Değişiklik anında kaydedilir, canlı vitrinde görünür.
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {GIFT_EDITOR_BLOCKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectBlock(item.id)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                selectedBlock === item.id ? 'bg-[#1f3f66] text-white' : 'bg-[rgba(140,145,165,0.12)] text-[var(--muted)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="px-1 text-[11px] font-bold text-[#1f3f66]">
          Seçili: {block.label}
        </p>
      </FormSectionPanel>

      <FormSectionPanel icon={Type} title="Font çeşitleri" compact>
        <div className="grid gap-2">
          {GIFT_FONT_PRESETS.map((font) => (
            <ModuleCard
              key={font.id}
              token={`font:${font.id}`}
              active={design.fontId === font.id}
              label={font.label}
              hint={font.hint}
              sample={font.sample}
              sampleStyle={{ fontFamily: font.display }}
              onApply={() => apply({ fontId: font.id })}
            />
          ))}
        </div>
      </FormSectionPanel>

      <FormSectionPanel icon={PanelsTopLeft} title="Banner slayt çeşitleri" compact>
        <p className="px-1 text-[11px] font-semibold text-[var(--muted)]">
          Banner alanına bırakın veya kartı tıklayın.
        </p>
        <div className="grid gap-2">
          {GIFT_BANNER_PRESETS.map((banner) => (
            <ModuleCard
              key={banner.id}
              token={`banner:${banner.id}`}
              active={design.bannerId === banner.id}
              label={banner.label}
              hint={banner.hint}
              onApply={() => {
                onSelectBlock('hero')
                apply({ bannerId: banner.id })
              }}
            />
          ))}
        </div>
      </FormSectionPanel>
    </aside>
  )
}
