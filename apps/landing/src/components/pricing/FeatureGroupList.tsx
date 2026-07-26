import FeatureItem from './FeatureItem'
import type { FeatureGroup } from './pricingTokens'

type FeatureGroupListProps = {
  groups: readonly FeatureGroup[]
  tone?: 'blue' | 'gold'
  compact?: boolean
}

/** Renders feature lists for a single plan (no cross-plan duplication). */
export default function FeatureGroupList({
  groups,
  tone = 'blue',
  compact = false,
}: FeatureGroupListProps) {
  const titleClass =
    tone === 'gold'
      ? 'text-[11px] font-bold tracking-[0.08em] text-[#FFB000]/90 uppercase'
      : 'text-[11px] font-bold tracking-[0.08em] text-[#64748B] uppercase'

  return (
    <div className={`flex flex-1 flex-col ${compact ? 'mt-5 gap-4' : 'mt-7 gap-6'}`}>
      {groups.map((group) => (
        <div key={group.title}>
          <p className={titleClass}>{group.title}</p>
          <ul className={`mt-2.5 flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
            {group.items.map((item) => (
              <FeatureItem key={`${group.title}-${item}`} label={item} tone={tone} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
