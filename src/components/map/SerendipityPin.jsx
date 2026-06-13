// src/components/map/SerendipityPin.jsx
// Renders serendipity pins on the map — category icon only, no name

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const CATEGORY_ICONS = {
  food: '🍜',
  culture: '🏛️',
  nature: '🌿',
  explorer: '🧭',
};

const CATEGORY_COLORS = {
  food: '#f97316',
  culture: '#8b5cf6',
  nature: '#22c55e',
  explorer: '#3b82f6',
};

function makeSerendipityIcon(category) {
  const emoji = CATEGORY_ICONS[category] || '✨';
  const color = CATEGORY_COLORS[category] || '#6366f1';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background: ${color};
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        box-shadow: 0 0 0 3px white, 0 0 12px rgba(0,0,0,0.3);
        animation: serendipity-pulse 2s infinite;
        cursor: pointer;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

export default function SerendipityPin({ pins, onPinClick }) {
  const map = useMap();

  useEffect(() => {
    if (!pins || !pins.length) return;

    const markers = pins.map((pin) => {
      const icon = makeSerendipityIcon(pin.category);
      const marker = L.marker([pin.lat, pin.lng], { icon });
      marker.on('click', () => onPinClick(pin));
      marker.addTo(map);
      return marker;
    });

    // Inject pulse animation if not already present
    if (!document.getElementById('serendipity-styles')) {
      const style = document.createElement('style');
      style.id = 'serendipity-styles';
      style.textContent = `
        @keyframes serendipity-pulse {
          0%   { box-shadow: 0 0 0 3px white, 0 0 12px rgba(0,0,0,0.3); }
          50%  { box-shadow: 0 0 0 6px white, 0 0 20px rgba(0,0,0,0.2); }
          100% { box-shadow: 0 0 0 3px white, 0 0 12px rgba(0,0,0,0.3); }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      markers.forEach((m) => map.removeLayer(m));
    };
  }, [pins, map, onPinClick]);

  return null;
}