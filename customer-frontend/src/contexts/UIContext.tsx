import { createContext, ReactNode, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface UIContextType {
  showToast: (message: string, type: ToastType) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (message: string, type: ToastType) => {
    // 간단한 alert로 구현 (추후 Toast 컴포넌트로 대체 가능)
    console.log(`[${type.toUpperCase()}] ${message}`);
    if (type === 'error') {
      alert(message);
    }
  };

  return (
    <UIContext.Provider
      value={{
        showToast,
        isLoading,
        setLoading: setIsLoading,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}
