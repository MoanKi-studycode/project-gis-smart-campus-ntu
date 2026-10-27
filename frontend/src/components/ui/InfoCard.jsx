// InfoCard.jsx
// Role: Show clicked object details directly under the search box (no modal/popup).
import React from 'react'

function renderProps(props) {
  const entries = Object.entries(props || {})
  if (entries.length === 0) return <div className="muted">Chưa có thông tin.</div>

  return (
    <dl className="prop-list">
      {entries.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt>{k}</dt>
          <dd>{String(v)}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

export default function InfoCard({ selection, onClose }) {
  if (!selection) return null

  return (
    <div className="infocard">
      <div className="infocard-header">
        <div className="infocard-title">{selection.title || 'Info'}</div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="infocard-body">
        <div className="muted">Layer: {selection.layer || '-'}</div>
        {renderProps(selection.props)}
      </div>
    </div>
  )
}
