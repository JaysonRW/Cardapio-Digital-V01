import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import {
  buildPrimaryOverrideVariables,
  getThemePrimaryColor,
  isValidHexColor,
  normalizeThemeIntensity,
  normalizeThemePreset,
} from '../lib/theme';
import { Settings } from '../types';

const DEFAULT_THEME_CLASS = 'theme-restaurant';

function resetThemeState(rootElement: HTMLElement, bodyElement: HTMLElement) {
  const themeClasses = Array.from(rootElement.classList).filter((className) => className.startsWith('theme-'));

  themeClasses.forEach((className) => {
    rootElement.classList.remove(className);
    bodyElement.classList.remove(className);
  });

  rootElement.classList.remove('light');
  bodyElement.classList.remove('light');

  const overrideVariables = [
    '--primary',
    '--primary-strong',
    '--primary-soft',
    '--primary-soft-border',
    '--primary-foreground',
    '--focus-ring',
    '--primary-opacity',
    '--primary-shadow-opacity',
  ];

  overrideVariables.forEach((variableName) => {
    rootElement.style.removeProperty(variableName);
  });
}

function applyTheme(settings?: Settings | null) {
  const rootElement = document.documentElement;
  const bodyElement = document.body;

  resetThemeState(rootElement, bodyElement);

  const preset = normalizeThemePreset(settings?.themePreset);
  const intensity = normalizeThemeIntensity(settings?.themeIntensity);
  const themeClass = `theme-${preset}`;
  const primaryColor = isValidHexColor(settings?.primaryColorOverride)
    ? settings?.primaryColorOverride
    : getThemePrimaryColor(preset);

  rootElement.classList.add(themeClass, 'light');
  bodyElement.classList.add(themeClass, 'light');

  const overrideVariables = buildPrimaryOverrideVariables(primaryColor, intensity);

  Object.entries(overrideVariables).forEach(([variableName, value]) => {
    rootElement.style.setProperty(variableName, value);
  });
}

export function ThemeController() {
  useEffect(() => {
    applyTheme(null);

    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'general'),
      (docSnap) => {
        if (!docSnap.exists()) {
          applyTheme(null);
          return;
        }

        const settings = { id: docSnap.id, ...docSnap.data() } as Settings;
        applyTheme(settings);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'settings/general'),
    );

    return () => {
      unsubscribe();

      if (typeof document !== 'undefined') {
        resetThemeState(document.documentElement, document.body);
        document.documentElement.classList.add(DEFAULT_THEME_CLASS, 'light');
        document.body.classList.add(DEFAULT_THEME_CLASS, 'light');
      }
    };
  }, []);

  return null;
}
