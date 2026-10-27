import { useSyncExternalStore } from 'react'

let currentViewer = null
const listeners = new Set()

export function setCesiumViewer(viewer) {
  if (viewer === currentViewer) return
  currentViewer = viewer
  for (const l of listeners) {
    try {
      l()
    } catch {
      // ignore listener errors
    }
  }
}

export function getCesiumViewer() {
  return currentViewer
}

export function subscribeCesiumViewer(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCesiumViewer() {
  return useSyncExternalStore(subscribeCesiumViewer, getCesiumViewer, getCesiumViewer)
}
