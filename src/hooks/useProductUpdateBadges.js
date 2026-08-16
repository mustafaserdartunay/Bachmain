import { useEffect, useState } from 'react'
import {
  countUnread,
  fetchProductUpdates,
  readUpdatesCache,
  UPDATE_CHANNELS,
} from '../utils/productUpdates'

function emptyCounts() {
  return { feature: 0, training: 0, package: 0 }
}

export default function useProductUpdateBadges() {
  const [version, setVersion] = useState(() => readUpdatesCache().version)
  const [counts, setCounts] = useState(() => {
    const items = readUpdatesCache().items || []
    return {
      feature: countUnread(items, UPDATE_CHANNELS.feature),
      training: countUnread(items, UPDATE_CHANNELS.training),
      package: countUnread(items, UPDATE_CHANNELS.package),
    }
  })

  useEffect(() => {
    let cancelled = false

    function refreshFromItems(items, nextVersion) {
      if (cancelled) return
      if (nextVersion) setVersion(nextVersion)
      setCounts({
        feature: countUnread(items, UPDATE_CHANNELS.feature),
        training: countUnread(items, UPDATE_CHANNELS.training),
        package: countUnread(items, UPDATE_CHANNELS.package),
      })
    }

    fetchProductUpdates()
      .then((payload) => refreshFromItems(payload.items, payload.version))
      .catch(() => {
        const cached = readUpdatesCache()
        refreshFromItems(cached.items || [], cached.version)
      })

    function onSeen() {
      const cached = readUpdatesCache()
      refreshFromItems(cached.items || [], cached.version)
    }
    window.addEventListener('bach:product-updates-seen', onSeen)
    return () => {
      cancelled = true
      window.removeEventListener('bach:product-updates-seen', onSeen)
    }
  }, [])

  return { version, counts }
}
