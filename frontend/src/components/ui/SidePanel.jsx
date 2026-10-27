import React, { useState } from 'react'

export default function SidePanel({ visibleLayers, onToggleLayer }) {
  const [open, setOpen] = useState(true)

  const toggle = (key) => (e) => {
    onToggleLayer?.(key, e.target.checked)
  }

  return (
    <aside className={`sidepanel ${open ? 'open' : 'closed'}`}>
      <div className="sidepanel-header">
        <h3>Layers</h3>
        <button onClick={() => setOpen((s) => !s)}>{open ? '«' : '»'}</button>
      </div>
      <div className="sidepanel-body">
        <div className="layer-item">
          <label>
            <input type="checkbox" checked={!!visibleLayers?.building} onChange={toggle('building')} /> Tòa nhà
          </label>
        </div>
        <div className="layer-item">
          <label>
            <input type="checkbox" checked={!!visibleLayers?.streets} onChange={toggle('streets')} /> Đường đi
          </label>
        </div>
        <div className="layer-item">
          <label>
            <input type="checkbox" checked={!!visibleLayers?.userviews} onChange={toggle('userviews')} /> Cây xanh
          </label>
        </div>
        <div className="layer-item">
          <label>
            <input type="checkbox" checked={!!visibleLayers?.extensions} onChange={toggle('extensions')} /> Tiện ích
          </label>
        </div>

        <div className="search">
          <input placeholder="Tìm kiếm..." />
        </div>

        <div className="crud">
          <h4>CRUD (stub)</h4>
          <div className="crud-row">
            <button disabled>Add</button>
            <button disabled>Edit</button>
            <button disabled>Delete</button>
          </div>
        </div>
      </div>
    </aside>
  )
}
