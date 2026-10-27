import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [is3d, setIs3d] = useState(true);
  const [layers, setLayers] = useState({
    buildings: true,
    streets: true,
    trees: true,
    extensions: true,
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded((v) => !v);
  }, []);

  const setSidebarExpanded = useCallback((value) => {
    setIsSidebarExpanded(!!value);
  }, []);

  const toggle3d = useCallback(() => {
    setIs3d((v) => !v);
  }, []);

  const toggleLayer = useCallback((layerKey) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  }, []);

  const value = useMemo(
    () => ({
      isSidebarExpanded,
      toggleSidebar,
      setSidebarExpanded,
      is3d,
      toggle3d,
      layers,
      toggleLayer,
      setLayers,
    }),
    [isSidebarExpanded, toggleSidebar, setSidebarExpanded, is3d, toggle3d, layers, toggleLayer]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUI must be used within UIProvider');
  }
  return ctx;
}
