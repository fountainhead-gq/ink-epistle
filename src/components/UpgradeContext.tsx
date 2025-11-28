
import { createContext, useContext } from 'react';

interface UpgradeContextType {
  triggerUpgrade: () => void;
}

export const UpgradeContext = createContext<UpgradeContextType>({
  triggerUpgrade: () => {},
});

export const useUpgradeModal = () => useContext(UpgradeContext);
