import React from 'react'

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo">NTU Smart Campus</div>
      </div>
      <div className="topbar-right">
        <button className="hamburger" aria-label="menu">☰</button>
      </div>
    </header>
  )
}
