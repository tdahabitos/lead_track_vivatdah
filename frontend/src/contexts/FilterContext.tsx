import { createContext, useContext, useState, type ReactNode } from 'react';

type FilterContextType = {
  days: number;
  setDays: (days: number) => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [days, setDays] = useState(30);

  return (
    <FilterContext.Provider value={{ days, setDays }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
