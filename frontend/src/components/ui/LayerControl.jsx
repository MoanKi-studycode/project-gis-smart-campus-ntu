import React, { useState } from 'react';
import { Layers, Check } from 'lucide-react';

export default function LayerControl({ layers, onToggle }) {
	const [isOpen, setIsOpen] = useState(false);

	const layerConfig = [
		{ key: 'buildings', label: 'Tòa nhà', color: 'bg-blue-500' },
		{ key: 'streets', label: 'Đường đi', color: 'bg-orange-500' },
		{ key: 'trees', label: 'Cây xanh', color: 'bg-green-600' },
		{ key: 'extensions', label: 'Tiện ích', color: 'bg-purple-500' },
	];

	return (
		<div className="relative">
			{/* Expandable List (Dropdown) - Opens Upwards */}
			<div
				className={`absolute bottom-full left-0 mb-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 origin-bottom-left z-50 ${
					isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
				}`}
			>
				<div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex justify-between items-center">
					<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lớp bản đồ</span>
					<span className="text-[10px] text-gray-400">{Object.values(layers || {}).filter(Boolean).length} active</span>
				</div>

				<div className="p-1.5 space-y-0.5">
					{layerConfig.map((layer) => (
						<button
							key={layer.key}
							type="button"
							onClick={() => onToggle?.(layer.key)}
							className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
								layers?.[layer.key] ? 'bg-blue-50/50 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
							}`}
						>
							<div className="flex items-center gap-3">
								<div className={`w-2 h-2 rounded-full transition-colors ${layers?.[layer.key] ? layer.color : 'bg-gray-300'}`} />
								<span className={`font-medium ${layers?.[layer.key] ? 'text-gray-900' : 'text-gray-500'}`}>
									{layer.label}
								</span>
							</div>

							{layers?.[layer.key] && <Check size={14} className="text-blue-600" />}
						</button>
					))}
				</div>
			</div>

			{/* Main Toggle Button */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={`relative z-50 w-11 h-11 rounded-xl shadow-lg flex items-center justify-center transition-all duration-200 border border-gray-200 hover:scale-105 active:scale-95 ${
					isOpen ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200' : 'bg-white text-gray-700 hover:bg-gray-50'
				}`}
				title="Lớp bản đồ"
			>
				<Layers size={20} />
			</button>

			{/* Backdrop for click-outside to close */}
			{isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
		</div>
	);
}
