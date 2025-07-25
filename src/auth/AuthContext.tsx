import { createContext, useContext, ReactNode } from 'react';
import { User } from 'netlify-identity-widget';

export interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
  authReady: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};
