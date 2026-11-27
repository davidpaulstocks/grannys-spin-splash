/**
 * How a big count of coins (or anything else a child saves up) is printed, so a number never
 * outgrows its button or pill: whole digits with thousands separators below 100,000, then a
 * compact "125K", "2.5M", "1.2B". One decimal only while the leading part is below 100; a
 * trailing ".0" is dropped.
 */

/** From this value on, a count is printed compactly. */
export const COMPACT_FROM = 100_000;
/** Below this leading figure (the 2 of "2.5M") one decimal is kept. */
const ONE_DECIMAL_BELOW = 100;
/** The unit has to roll over to the next one at this leading figure ("1000K" is "1M"). */
const ROLLOVER = 1000;
const UNITS: readonly (readonly [number, string])[] = [
  [1_000, 'K'],
  [1_000_000, 'M'],
  [1_000_000_000, 'B'],
];

/** "1,120", "99,999", "125K", "2.5M", "12M", "1.2B". Rounds to a whole number first below 100,000. */
export function formatCount(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs < COMPACT_FROM) return `${sign}${Math.round(abs).toLocaleString('en-US')}`;
  let index = 0;
  for (let i = UNITS.length - 1; i >= 0; i--) {
    if (abs >= (UNITS[i] as readonly [number, string])[0]) {
      index = i;
      break;
    }
  }
  for (;;) {
    const [size, suffix] = UNITS[index] as readonly [number, string];
    const lead = abs / size;
    const text = lead < ONE_DECIMAL_BELOW ? `${Number(lead.toFixed(1))}` : `${Math.round(lead)}`;
    if (Number(text) >= ROLLOVER && index < UNITS.length - 1) {
      index += 1;
      continue;
    }
    return `${sign}${text}${suffix}`;
  }
}
