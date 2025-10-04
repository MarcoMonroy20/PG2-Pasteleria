import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DataContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useDataRefresh = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataRefresh must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DataContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </DataContext.Provider>
  );
};
