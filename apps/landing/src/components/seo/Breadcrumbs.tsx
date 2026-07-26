import Link from 'next/link'
import { absoluteUrl } from '../../seo/site'
import BreadcrumbSchema from './schema/BreadcrumbSchema'

type Crumb = { name: string; path: string }

type BreadcrumbsProps = {
  items: Crumb[]
  className?: string
}

/**
 * Visual + schema.org BreadcrumbList (single source — do not also emit BreadcrumbSchema elsewhere).
 */
export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items?.length) return null

  return (
    <>
      <BreadcrumbSchema items={items} />
      <nav
        aria-label="Breadcrumb"
        className={`mx-auto max-w-7xl px-4 pt-[4.6rem] pb-1 text-[11px] font-medium text-slate-500 lg:px-8 ${className}`}
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, index) => {
            const last = index === items.length - 1
            return (
              <li key={item.path} className="flex items-center gap-1.5">
                {index > 0 ? (
                  <span className="text-slate-300" aria-hidden>
                    /
                  </span>
                ) : null}
                {last ? (
                  <span className="text-slate-700" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="transition hover:text-blue-600"
                    title={absoluteUrl(item.path)}
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
