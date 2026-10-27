import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, X, Building2 } from 'lucide-react';
import { useMap } from '../../contexts/MapContext';
import { Modal, Button } from '../Common';

/**
 * LocationPreviewModal - Visual Trigger UI for Map Navigation
 * 
 * Shows a preview of the target location before flying
 * Triggered from Schedule/Event pages when user clicks map icon
 * When confirmed, navigates to map page and flies camera to location
 */

export default function LocationPreviewModal() {
  const navigate = useNavigate();
  const { isPreviewOpen, previewData, triggerFlyTo, closePreview } = useMap();

  if (!isPreviewOpen || !previewData) return null;

  const {
    name = 'Unknown Building',
    buildingId,
    roomId,
    imageUrl,
    address,
  } = previewData;

  // Generate placeholder image if none provided
  const displayImage = imageUrl || 
    `https://placehold.co/600x300/1e40af/ffffff?text=${encodeURIComponent(name)}`;

  // Handle GO button click - navigate to map and fly
  const handleGoClick = () => {
    triggerFlyTo(null, navigate);
  };

  return (
    <Modal
      isOpen={isPreviewOpen}
      onClose={closePreview}
      size="lg"
      showCloseButton={false}
    >
      <div className="relative">
        {/* Close Button */}
        <button
          onClick={closePreview}
          className="absolute -top-2 -right-2 z-10 p-2 bg-white rounded-full shadow-lg 
                     text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Building Image */}
        <div className="relative rounded-xl overflow-hidden mb-6">
          <img
            src={displayImage}
            alt={name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.src = `https://placehold.co/600x300/6366f1/ffffff?text=${encodeURIComponent(name)}`;
            }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Building Badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{name}</h3>
              {buildingId && (
                <p className="text-white/80 text-sm">Mã tòa nhà: {buildingId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="space-y-4 mb-6">
          {/* Destination */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Điểm đến</p>
              <p className="text-lg font-semibold text-gray-800">
                {roomId ? `Phòng ${roomId}` : name}
              </p>
            </div>
          </div>

          {/* Address if available */}
          {address && (
            <div className="flex items-start gap-3 px-4">
              <MapPin size={18} className="text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-600">{address}</p>
            </div>
          )}

          {/* Travel Info */}
          <div className="flex items-center justify-center gap-6 py-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">~2s</p>
              <p className="text-xs text-gray-500">Thời gian bay</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">3D</p>
              <p className="text-xs text-gray-500">Chế độ xem</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={closePreview}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleGoClick}
            icon={<Navigation size={18} />}
            className="flex-1 !bg-gradient-to-r !from-blue-600 !to-indigo-600 !border-0"
          >
            ĐI ĐẾN ĐÓ
          </Button>
        </div>
      </div>
    </Modal>
  );
}
