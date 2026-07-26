'use client'

/**
 * react-router-dom → Next.js App Router compatibility shim.
 * Keeps existing marketing components working without visual changes.
 */
import NextLink from 'next/link'
import {
  usePathname,
  useRouter,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from 'next/navigation'
import { forwardRef, useCallback, useMemo, type AnchorHTMLAttributes, type ReactNode } from 'react'

type To = string | { pathname?: string; search?: string; hash?: string }

function resolveTo(to: To): string {
  if (typeof to === 'string') return to
  const path = to.pathname || '/'
  const search = to.search ? (to.search.startsWith('?') ? to.search : `?${to.search}`) : ''
  const hash = to.hash ? (to.hash.startsWith('#') ? to.hash : `#${to.hash}`) : ''
  return `${path}${search}${hash}`
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: To
  replace?: boolean
  children?: ReactNode
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function CompatLink(
  { to, children, replace, ...rest },
  ref,
) {
  const href = resolveTo(to)
  return (
    <NextLink ref={ref} href={href} replace={replace} {...rest}>
      {children}
    </NextLink>
  )
})

export function useLocation() {
  const pathname = usePathname() || '/'
  const searchParams = useNextSearchParams()
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : ''
  return useMemo(
    () => ({
      pathname,
      search,
      hash: typeof window !== 'undefined' ? window.location.hash : '',
      state: null,
      key: 'default',
    }),
    [pathname, search],
  )
}

export function useNavigate() {
  const router = useRouter()
  return useCallback(
    (to: To | number, options?: { replace?: boolean }) => {
      if (typeof to === 'number') {
        if (to < 0) router.back()
        else router.forward()
        return
      }
      const href = resolveTo(to)
      if (options?.replace) router.replace(href)
      else router.push(href)
    },
    [router],
  )
}

export function useParams<T extends Record<string, string | string[]> = Record<string, string>>() {
  return useNextParams() as T
}

export function useSearchParams(): [
  URLSearchParams,
  (
    next:
      | URLSearchParams
      | Record<string, string>
      | ((prev: URLSearchParams) => URLSearchParams | Record<string, string>),
    opts?: { replace?: boolean },
  ) => void,
] {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const nextParams = useNextSearchParams()

  const params = useMemo(() => new URLSearchParams(nextParams?.toString() || ''), [nextParams])

  const setSearchParams = useCallback(
    (
      next:
        | URLSearchParams
        | Record<string, string>
        | ((prev: URLSearchParams) => URLSearchParams | Record<string, string>),
      opts?: { replace?: boolean },
    ) => {
      const current = new URLSearchParams(nextParams?.toString() || '')
      const resolved = typeof next === 'function' ? next(current) : next
      const qs =
        resolved instanceof URLSearchParams
          ? resolved.toString()
          : new URLSearchParams(resolved).toString()
      const href = qs ? `${pathname}?${qs}` : pathname
      if (opts?.replace) router.replace(href)
      else router.push(href)
    },
    [nextParams, pathname, router],
  )

  return [params, setSearchParams]
}

export function BrowserRouter({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export function Routes({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export function Route(_props: Record<string, unknown>) {
  return null
}

export function NavLink(props: LinkProps) {
  return <Link {...props} />
}

export function Outlet() {
  return null
}

export function Navigate({ to, replace }: { to: To; replace?: boolean }) {
  const router = useRouter()
  const href = resolveTo(to)
  if (typeof window !== 'undefined') {
    queueMicrotask(() => {
      if (replace) router.replace(href)
      else router.push(href)
    })
  }
  return null
}
