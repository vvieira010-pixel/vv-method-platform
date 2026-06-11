/**
 * color-utils.js — Color manipulation utilities for the design system.
 */

/**
 * Adjusts the brightness of a hex color.
 * @param {string} hex - The hex color string (e.g., "#ffffff").
 * @param {number} percent - The percentage to adjust (positive to lighten, negative to darken).
 * @returns {string} The adjusted hex color string.
 */
export function shadeColor(hex, percent) {
  const f = parseInt(hex.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const R = (f >> 16) & 0xff;
  const G = (f >> 8) & 0xff;
  const B = f & 0xff;

  const r = Math.round((t - R) * p + R);
  const g = Math.round((t - G) * p + G);
  const b = Math.round((t - B) * p + B);

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Generates a softer version of a hex color.
 * @param {string} hex - The hex color string.
 * @returns {string} The softened hex color string.
 */
export function softColor(hex) {
  return shadeColor(hex, 65);
}

