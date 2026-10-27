// HoverTooltip.jsx
// Role: Lightweight hover tooltip near cursor.
import React from 'react'

export default function HoverTooltip({ hover }) {
  if (!hover?.title) return null
  if (hover.x === undefined || hover.x === null) return null
  if (hover.y === undefined || hover.y === null) return null

  return (
    <div
      className="hover-tooltip"
      style={{ left: hover.x + 12, top: hover.y + 12 }}
      aria-hidden
    >
      {hover.title}
    </div>
  )
}
