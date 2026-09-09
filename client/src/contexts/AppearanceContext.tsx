import { createContext, useContext } from 'react';
export type AppearanceMode = 'light' | 'dark';
export const AppearanceContext = createContext<{mode: AppearanceMode; toggleMode: () => void}>({mode: 'light', toggleMode: () => {}});
export const useAppearance = () => useContext(AppearanceContext);
