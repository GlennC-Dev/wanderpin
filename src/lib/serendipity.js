// src/lib/serendipity.js
// Serendipity Pin scoring and selection algorithm

import { filterByRadius, distanceMetres } from './geo';

const SERENDIPITY_RADIUS_M = 200;
const CLOSE_RADIUS_M = 100;
const MAX_ACTIVE_PINS = 3;
const SKIP_NEGATIVE_THRESHOLD = 2; // skips before category gets penalised

// Scoring modifiers
const SCORE_VISITED_CATEGORY_MATCH = 0.4;
const SCORE_PATH_CATEGORY_MATCH = 0.3;
const SCORE_CLOSE_PROXIMITY = 0.2;
const SCORE_CATEGORY_SKIP_PENALTY = -0.5;
const SCORE_PIN_SKIP_PENALTY = -0.9;

/**
 * Get today's date string YYYY-MM-DD for filtering daily data
 */
export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Derive category weights from today's visited pins
 * Returns { category: count } map
 */
export function buildVisitedCategoryWeights(todayPinStates) {
  const weights = {};
  for (const pin of todayPinStates) {
    if (pin.state === 'visited') {
      weights[pin.category] = (weights[pin.category] || 0) + 1;
    }
  }
  return weights;
}

/**
 * Count how many times each category was skipped today
 * Returns { category: count } map
 */
export function buildSkipCategoryCount(todaySkips) {
  const counts = {};
  for (const skip of todaySkips) {
    counts[skip.category] = (counts[skip.category] || 0) + 1;
  }
  return counts;
}

/**
 * Score a single candidate pin
 */
function scorePin({
  pin,
  userLat,
  userLng,
  visitedCategoryWeights,
  skipCategoryCount,
  skippedOsmIds,
  activePathCategory,
  topVisitedCategory,
}) {
  let score = 1.0;

  // Hard exclude if this specific pin was skipped today
  if (skippedOsmIds.has(pin.osm_id)) {
    score += SCORE_PIN_SKIP_PENALTY;
  }

  // Category skip penalty
  const categorySkips = skipCategoryCount[pin.category] || 0;
  if (categorySkips >= SKIP_NEGATIVE_THRESHOLD) {
    score += SCORE_CATEGORY_SKIP_PENALTY;
  }

  // Boost if matches today's most visited category
  if (pin.category === topVisitedCategory) {
    score += SCORE_VISITED_CATEGORY_MATCH;
  }

  // Boost if matches active path category
  if (activePathCategory && pin.category === activePathCategory) {
    score += SCORE_PATH_CATEGORY_MATCH;
  }

  // Proximity boost — closer than 100m

  const dist = distanceMetres(userLat, userLng, pin.lat, pin.lng);
  if (dist <= CLOSE_RADIUS_M) {
    score += SCORE_CLOSE_PROXIMITY;
  }

  return Math.max(0, score); // floor at 0
}

/**
 * Weighted random selection from a scored array
 * Each item: { pin, score }
 */
function weightedRandom(scoredPins) {
  const total = scoredPins.reduce((sum, s) => sum + s.score, 0);
  if (total <= 0) return scoredPins[Math.floor(Math.random() * scoredPins.length)]?.pin ?? null;

  let rand = Math.random() * total;
  for (const { pin, score } of scoredPins) {
    rand -= score;
    if (rand <= 0) return pin;
  }
  return scoredPins[scoredPins.length - 1]?.pin ?? null;
}

/**
 * Main selection function — returns up to 3 serendipity pins
 * Slot 1: highest weighted category (weighted random within)
 * Slot 2: second highest weighted category (weighted random within)
 * Slot 3: forced wildcard from remaining categories (pure random)
 */
export function selectSerendipityPins({
  candidatePins,        // all nearby OSM pins (pre-filtered, not visited, not active)
  userLat,
  userLng,
  todayPinStates,       // pin_states rows for today
  todaySkips,           // serendipity_skips rows for today
  activePathCategory,   // string | null
  activePinCategories,  // categories already showing as serendipity pins
}) {
  if (!candidatePins.length) return [];

  // Filter to within 200m
  const nearby = filterByRadius(candidatePins, userLat, userLng, SERENDIPITY_RADIUS_M);
  if (!nearby.length) return [];

  // Build weighting context
  const visitedCategoryWeights = buildVisitedCategoryWeights(todayPinStates);
  const skipCategoryCount = buildSkipCategoryCount(todaySkips);
  const skippedOsmIds = new Set(todaySkips.map((s) => s.osm_id));

  // Find top visited category
  const topVisitedCategory = Object.entries(visitedCategoryWeights)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Score all candidates
  const scored = nearby
    .filter((pin) => !activePinCategories.includes(pin.category)) // exclude active serendipity categories
    .map((pin) => ({
      pin,
      score: scorePin({
        pin,
        userLat,
        userLng,
        visitedCategoryWeights,
        skipCategoryCount,
        skippedOsmIds,
        activePathCategory,
        topVisitedCategory,
      }),
    }))
    .filter((s) => s.score > 0.1); // effectively exclude hard-penalised pins

  if (!scored.length) return [];

  // Group by category
  const byCategory = {};
  for (const s of scored) {
    if (!byCategory[s.pin.category]) byCategory[s.pin.category] = [];
    byCategory[s.pin.category].push(s);
  }

  const categories = Object.keys(byCategory);
  if (!categories.length) return [];

  // Sort categories by total score weight (descending)
  const rankedCategories = categories.sort((a, b) => {
    const sumA = byCategory[a].reduce((acc, s) => acc + s.score, 0);
    const sumB = byCategory[b].reduce((acc, s) => acc + s.score, 0);
    return sumB - sumA;
  });

  const selected = [];
  const usedCategories = new Set();

  // Slot 1 — top weighted category
  if (rankedCategories[0]) {
    const cat = rankedCategories[0];
    const pin = weightedRandom(byCategory[cat]);
    if (pin) { selected.push(pin); usedCategories.add(cat); }
  }

  // Slot 2 — second weighted category
  if (rankedCategories[1]) {
    const cat = rankedCategories[1];
    const pin = weightedRandom(byCategory[cat]);
    if (pin) { selected.push(pin); usedCategories.add(cat); }
  }

  // Slot 3 — wildcard: random from remaining categories
  const remainingCats = rankedCategories.filter((c) => !usedCategories.has(c));
  if (remainingCats.length) {
    const randomCat = remainingCats[Math.floor(Math.random() * remainingCats.length)];
    const pin = weightedRandom(byCategory[randomCat]);
    if (pin) selected.push(pin);
  }

  return selected.slice(0, MAX_ACTIVE_PINS);
}