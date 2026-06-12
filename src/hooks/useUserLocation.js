// src/hooks/useUserLocation.js
// Live GPS hook with fallback to home base if GPS unavailable or denied

import { useState, useEffect, useRef } from 'react';
import { useHomeBase } from './useHomeBase';

export function useUserLocation() {
  const { homeBase } = useHomeBase();
  const [location, setLocation] = useState(null); // { lat, lng, source: 'gps' | 'homebase' }
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      // Browser doesn't support GPS — fall back immediately
      if (homeBase) {
        setLocation({ lat: homeBase.lat, lng: homeBase.lng, source: 'homebase' });
      }
      setError('Geolocation not supported');
      return;
    }

    // Try to get live GPS
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: 'gps',
        });
        setError(null);
      },
      (err) => {
        // GPS denied or failed — fall back to home base
        setError(err.message);
        if (homeBase) {
          setLocation({ lat: homeBase.lat, lng: homeBase.lng, source: 'homebase' });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [homeBase]);

  return { location, error };
}