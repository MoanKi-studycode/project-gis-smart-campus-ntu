import React from 'react';

export default function FloatingButtons({ onHome, is3d, onToggle3d }) {
	return (
		<div className="flex flex-col gap-3">
			<button
				type="button"
				onClick={onToggle3d}
				title={is3d ? 'Chuyển 2D' : 'Chuyển 3D'}
				className="w-11 h-11 rounded-xl shadow-lg flex items-center justify-center border border-gray-200 bg-white/90 backdrop-blur text-gray-800 hover:bg-white transition-colors font-bold"
			>
				{is3d ? '2D' : '3D'}
			</button>
		</div>
	);
}
