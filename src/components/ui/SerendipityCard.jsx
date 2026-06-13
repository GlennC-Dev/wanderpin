// src/components/ui/SerendipityCard.jsx
// Teaser card shown when user taps a serendipity pin — category + evocative line only

import { useState } from 'react';

const CATEGORY_ICONS = {
  food: '🍜',
  culture: '🏛️',
  nature: '🌿',
  explorer: '🧭',
};

const CATEGORY_LABELS = {
  food: 'Something delicious nearby',
  culture: 'A story waiting to be found',
  nature: 'A breath of fresh air',
  explorer: 'Something unexpected ahead',
};

const CATEGORY_COLORS = {
  food: 'bg-orange-500',
  culture: 'bg-violet-500',
  nature: 'bg-green-500',
  explorer: 'bg-blue-500',
};

export default function SerendipityCard({
  pin,
  skipsRemaining,
  onSkip,
  onReveal,
  onClose,
  isDark,
}) {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => {
    setRevealed(true);
    if (onReveal) onReveal(pin);
  };

  const handleSkip = () => {
    if (skipsRemaining <= 0) return;
    onSkip(pin);
    onClose();
  };

  const icon = CATEGORY_ICONS[pin.category] || '✨';
  const teaser = CATEGORY_LABELS[pin.category] || 'Something nearby…';
  const colorClass = CATEGORY_COLORS[pin.category] || 'bg-indigo-500';

  return (
    <div className={`
      fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000]
      w-80 rounded-2xl shadow-2xl overflow-hidden
      ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
    `}>
      {/* Category color band */}
      <div className={`${colorClass} px-5 py-4 flex items-center gap-3`}>
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-white text-xs font-semibold uppercase tracking-widest opacity-80">
            Serendipity
          </p>
          <p className="text-white text-base font-semibold leading-tight">
            {teaser}
          </p>
        </div>
      </div>

      {/* Revealed content or mystery state */}
      <div className="px-5 py-4">
        {revealed ? (
          <div>
            <p className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {pin.name}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {pin.category.charAt(0).toUpperCase() + pin.category.slice(1)}
            </p>
          </div>
        ) : (
          <p className={`text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Tap explore to find out what's here…
          </p>
        )}
      </div>

      {/* Actions */}
      <div className={`px-5 pb-5 flex gap-3`}>
        {!revealed && (
          <button
            onClick={handleReveal}
            className={`flex-1 py-2 rounded-xl font-semibold text-sm ${colorClass} text-white`}
          >
            Explore
          </button>
        )}
        {!revealed && (
          <button
            onClick={handleSkip}
            disabled={skipsRemaining <= 0}
            className={`
              flex-1 py-2 rounded-xl font-semibold text-sm border
              ${skipsRemaining <= 0
                ? 'opacity-40 cursor-not-allowed'
                : isDark
                  ? 'border-gray-600 text-gray-300'
                  : 'border-gray-300 text-gray-600'
              }
            `}
          >
            Skip {skipsRemaining > 0 ? `(${skipsRemaining} left)` : '(none left)'}
          </button>
        )}
        <button
          onClick={onClose}
          className={`
            ${revealed ? 'flex-1' : 'px-3'} py-2 rounded-xl text-sm
            ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
          `}
        >
          Close
        </button>
      </div>
    </div>
  );
}