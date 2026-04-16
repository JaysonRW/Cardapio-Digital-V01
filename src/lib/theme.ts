export type ThemePresetId =
  | 'acai'
  | 'cafe'
  | 'pastel'
  | 'burguer'
  | 'marmita'
  | 'restaurant'
  | 'sushi'
  | 'vegan'
  | 'churrasco'
  | 'pizza'
  | 'doceria'
  | 'bar'
  | 'fit'
  | 'frango'
  | 'brunch';

export type ThemeIntensity = 'leve' | 'medio' | 'forte';

export interface ThemePreset {
  id: ThemePresetId;
  label: string;
  description: string;
  color: string;
}

export const DEFAULT_THEME_PRESET: ThemePresetId = 'restaurant';
export const DEFAULT_THEME_INTENSITY: ThemeIntensity = 'medio';

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'acai', label: 'Açaiteria', description: 'Roxo vibrante, jovem e energético.', color: '#7C3AED' },
  { id: 'cafe', label: 'Cafeteria', description: 'Tons terrosos, acolhedor e elegante.', color: '#6B4F3B' },
  { id: 'pastel', label: 'Pastelaria', description: 'Dourado alegre, rápido e informal.', color: '#F59E0B' },
  { id: 'burguer', label: 'Hamburgueria', description: 'Vermelho forte e apelo visual intenso.', color: '#EF4444' },
  { id: 'marmita', label: 'Marmitaria', description: 'Verde confiável com foco em praticidade.', color: '#10B981' },
  { id: 'restaurant', label: 'Restaurante', description: 'Versátil, premium e equilibrado.', color: '#F97316' },
  { id: 'sushi', label: 'Sushi', description: 'Sofisticado, limpo e contemporâneo.', color: '#0F172A' },
  { id: 'vegan', label: 'Vegano', description: 'Natural, fresco e leve.', color: '#22C55E' },
  { id: 'churrasco', label: 'Churrascaria', description: 'Marcante, robusto e tradicional.', color: '#7F1D1D' },
  { id: 'pizza', label: 'Pizzaria', description: 'Quente, convidativo e familiar.', color: '#DC2626' },
  { id: 'doceria', label: 'Doceria', description: 'Suave, delicado e memorável.', color: '#EC4899' },
  { id: 'bar', label: 'Bar / Pub', description: 'Noturno, urbano e descontraído.', color: '#D97706' },
  { id: 'fit', label: 'Saudável / Fit', description: 'Limpo, leve e vibrante.', color: '#14B8A6' },
  { id: 'frango', label: 'Frango Frito', description: 'Amarelo crocante e energético.', color: '#EAB308' },
  { id: 'brunch', label: 'Brunch', description: 'Claro, acolhedor e solar.', color: '#F59E0B' },
];

const THEME_PRESET_IDS = new Set<ThemePresetId>(THEME_PRESETS.map((preset) => preset.id));
const THEME_INTENSITY_VALUES: ThemeIntensity[] = ['leve', 'medio', 'forte'];

const THEME_INTENSITY_CONFIG: Record<
  ThemeIntensity,
  {
    strongMix: number;
    softMix: number;
    softBorderMix: number;
    focusMix: number;
    opacity: string;
    shadowOpacity: string;
  }
> = {
  leve: {
    strongMix: 0.08,
    softMix: 0.94,
    softBorderMix: 0.84,
    focusMix: 0.72,
    opacity: '0.08',
    shadowOpacity: '0.10',
  },
  medio: {
    strongMix: 0.14,
    softMix: 0.9,
    softBorderMix: 0.76,
    focusMix: 0.58,
    opacity: '0.12',
    shadowOpacity: '0.16',
  },
  forte: {
    strongMix: 0.2,
    softMix: 0.85,
    softBorderMix: 0.66,
    focusMix: 0.44,
    opacity: '0.18',
    shadowOpacity: '0.22',
  },
};

export function normalizeThemePreset(value?: string): ThemePresetId {
  if (value && THEME_PRESET_IDS.has(value as ThemePresetId)) {
    return value as ThemePresetId;
  }

  return DEFAULT_THEME_PRESET;
}

export function normalizeThemeIntensity(value?: string): ThemeIntensity {
  if (value && THEME_INTENSITY_VALUES.includes(value as ThemeIntensity)) {
    return value as ThemeIntensity;
  }

  return DEFAULT_THEME_INTENSITY;
}

export function getThemePreset(presetId?: string): ThemePreset {
  const normalizedPreset = normalizeThemePreset(presetId);

  return THEME_PRESETS.find((preset) => preset.id === normalizedPreset) ?? THEME_PRESETS[0];
}

export function getThemePrimaryColor(presetId?: string): string {
  return getThemePreset(presetId).color;
}

export function isValidHexColor(value?: string): boolean {
  if (!value) {
    return false;
  }

  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value.trim());
}

function expandShortHex(hex: string): string {
  const normalized = hex.trim().replace('#', '');

  if (normalized.length === 3) {
    return normalized
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
  }

  return normalized;
}

function hexToRgb(hex: string) {
  const normalized = expandShortHex(hex);

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
    .join('')}`;
}

function mixHexColors(hexA: string, hexB: string, ratio: number): string {
  const first = hexToRgb(hexA);
  const second = hexToRgb(hexB);
  const clampedRatio = Math.max(0, Math.min(1, ratio));

  return rgbToHex(
    first.r + (second.r - first.r) * clampedRatio,
    first.g + (second.g - first.g) * clampedRatio,
    first.b + (second.b - first.b) * clampedRatio,
  );
}

function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);

  const [red, green, blue] = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function getContrastRatio(hexA: string, hexB: string): number {
  const luminanceA = getLuminance(hexA);
  const luminanceB = getLuminance(hexB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getPrimaryForegroundColor(primaryColor: string): string {
  const lightForeground = '#ffffff';
  const darkForeground = '#111827';

  return getContrastRatio(primaryColor, darkForeground) >= getContrastRatio(primaryColor, lightForeground)
    ? darkForeground
    : lightForeground;
}

export function buildPrimaryOverrideVariables(
  primaryColor?: string,
  intensity: ThemeIntensity = DEFAULT_THEME_INTENSITY,
): Record<string, string> {
  if (!isValidHexColor(primaryColor)) {
    return {};
  }

  const normalizedPrimary = `#${expandShortHex(primaryColor).toUpperCase()}`;
  const foreground = getPrimaryForegroundColor(normalizedPrimary);
  const normalizedIntensity = normalizeThemeIntensity(intensity);
  const config = THEME_INTENSITY_CONFIG[normalizedIntensity];

  return {
    '--primary': normalizedPrimary,
    '--primary-strong': mixHexColors(normalizedPrimary, '#111827', config.strongMix),
    '--primary-soft': mixHexColors(normalizedPrimary, '#ffffff', config.softMix),
    '--primary-soft-border': mixHexColors(normalizedPrimary, '#ffffff', config.softBorderMix),
    '--primary-foreground': foreground,
    '--focus-ring': mixHexColors(normalizedPrimary, '#ffffff', config.focusMix),
    '--primary-opacity': config.opacity,
    '--primary-shadow-opacity': config.shadowOpacity,
  };
}
