// SearchBox.jsx
// Role: Google-Maps-like search input overlay (white card) with a ☰ menu button.
import React from 'react'

export default function SearchBox({ value, onChange, onMenuClick }) {
  return (
    <div className="searchbox" role="search">
      <button
        className="icon-btn"
        type="button"
        aria-label="Open sidebar"
        title="Menu"
        onClick={() => onMenuClick?.()}
      >
        ☰
      </button>
      <input
        className="searchbox-input"
        placeholder="Tìm lớp học / tiện ích..."
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  )
}
