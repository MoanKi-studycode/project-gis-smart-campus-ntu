let lockUntilMs = 0
let lockReason = null
let lastCommandAtMs = 0
let lastCommandKey = null

function now() {
  return Date.now()
}

function isLocked() {
  return now() < lockUntilMs
}

function lock(reason, ms = 2500) {
  lockReason = reason
  lockUntilMs = now() + ms
}

function shouldSkipCommand(reason) {
  // Search has priority over everything.
  if (reason === 'search') return false

  // During/shortly after a search flyTo, block init/layer-driven camera resets.
  if (isLocked()) return true

  return false
}

function dedupe(key, minIntervalMs = 150) {
  const t = now()
  if (lastCommandKey === key && t - lastCommandAtMs < minIntervalMs) return true
  lastCommandKey = key
  lastCommandAtMs = t
  return false
}

export const CameraController = {
  // Exposed for guards
  isLocked,
  getLockReason: () => lockReason,

  // Deprecated: camera movement is owned by <CameraManager />.
  flyToFeatureFromSearch() {
    return false
  },

  // Initial camera positioning (lowest priority)
  flyToHomeOnce(didRef, flyFn, key = 'init:home') {
    if (didRef?.current) return false
    if (shouldSkipCommand('init')) {
      console.log('[CameraController] init flyTo skipped (camera locked)', { lockReason })
      return false
    }
    if (dedupe(key)) return false

    didRef.current = true
    try {
      flyFn()
      console.log('[CameraController] init flyTo executed')
      return true
    } catch (e) {
      console.warn('[CameraController] init flyTo failed', e)
      return false
    }
  }
}
