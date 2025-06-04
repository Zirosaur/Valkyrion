import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UserData {
  id: number;
  username: string;
  displayName?: string;
  discordId: string;
  discordUsername: string;
  discordAvatar?: string;
  email?: string;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  logout: () => void;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<{ user: UserData | null }>({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log('Logout response:', result);
      
      if (response.ok) {
        // Clear all React Query cache
        queryClient.clear();
        // Force refetch user data
        await refetch();
        // Reload page to clear any remaining state
        window.location.reload();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user: data?.user || null, isLoading, logout, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}