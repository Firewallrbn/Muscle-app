import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    input: string;
    accent: string;
    secondary: string;
  };
}

const STORAGE_KEY = '@muscle:theme';

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#F7F7F7',
    card: '#FFFFFF',
    border: '#EDEDED',
    text: '#111111',
    textSecondary: '#555555',
    input: '#FFFFFF',
    accent: '#FC3058',
    secondary: '#0A84FF',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#0E0E10',
    card: '#1C1C1E',
    border: '#2A2A2E',
    text: '#FFFFFF',
    textSecondary: '#8C8B91',
    input: '#1C1C1E',
    accent: '#FC3058',
    secondary: '#0A84FF',
  },
};

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (mode?: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(lightTheme);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedMode = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedMode === 'dark') {
          setTheme(darkTheme);
        }
      } catch (error) {
        console.error('Failed to load theme', error);
      }
    };

    loadTheme();
  }, []);

  const persistMode = useCallback(async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to persist theme', error);
    }
  }, []);

  const toggleTheme = useCallback(
    (mode?: ThemeMode) => {
      setTheme((current) => {
        const nextMode: ThemeMode = mode ?? (current.mode === 'light' ? 'dark' : 'light');
        const nextTheme = nextMode === 'light' ? lightTheme : darkTheme;
        persistMode(nextMode);
        return nextTheme;
      });
    },
    [persistMode],
  );

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export const themes = { light: lightTheme, dark: darkTheme };
