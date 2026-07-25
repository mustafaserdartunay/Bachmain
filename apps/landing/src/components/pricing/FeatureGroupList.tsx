import FeatureItem from './FeatureItem'
import type { FeatureGroup } from './pricingTokens'

type FeatureGroupListProps = {
  groups: readonly FeatureGroup[]
  tone?: 'blue' | 'gold'
}

/** Renders grouped feature lists (Starter → Pro → Enterprise). */
export default function FeatureGroupList({ groups, tone = 'blue' }: FeatureGroupListProps) {
  const titleClass =
    tone === 'gold'
      ? 'text-[11px] font-bold tracking-[0.08em] text-[#FFB000]/90 uppercase'
      : 'text-[11px] font-bold tracking-[0.08em] text-[#64748B] uppercase'

  return (
    <div className="mt-7 flex flex-1 flex-col gap-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className={titleClass}>{group.title}</p>
          <ul className="mt-3 flex flex-col gap-3">
            {group.items.map((item) => (
              <FeatureItem key={`${group.title}-${item}`} label={item} tone={tone} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
