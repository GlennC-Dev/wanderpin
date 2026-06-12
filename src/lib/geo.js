// src/lib/geo.js
// Haversine distance helpers for Serendipity Pin proximity logic

const EARTH_RADIUS_M = 6371000; // metres

/**
 * Convert degrees to radians
 */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two lat/lng points, returns metres
 */
export function distanceMetres(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns true if two points are within `thresholdMetres` of each other
 */
export function isWithinRadius(lat1, lng1, lat2, lng2, thresholdMetres) {
  return distanceMetres(lat1, lng1, lat2, lng2) <= thresholdMetres;
}

/**
 * Returns true if a location has moved significantly (>50m) from a reference point.
 * Used to determine if the skip cycle should reset.
 */
export function hasMovedSignificantly(lat1, lng1, lat2, lng2) {
  return distanceMetres(lat1, lng1, lat2, lng2) > 50;
}

/**
 * Given a list of pins [{lat, lng, ...}], return those within radius metres of a point
 */
export function filterByRadius(pins, userLat, userLng, radiusMetres) {
  return pins.filter((pin) =>
    isWithinRadius(userLat, userLng, pin.lat, pin.lng, radiusMetres)
  );
}