import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, loginUser } from '../lib/api/chatwootAPI';

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      return {
        user: null,
        isLoggedIn: false,
        isLoading: false,
        error: null,

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const user = await loginUser(email, password);
            set({ 
              user, 
              isLoggedIn: true, 
              isLoading: false,
              error: null 
            });
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Erro no login' 
            });
          }
        },

        logout: () => {
          set({ 
            user: null, 
            isLoggedIn: false, 
            isLoading: false,
            error: null 
          });
          
          // Limpar localStorage manualmente para garantir
          if (typeof window !== 'undefined') {
            localStorage.removeItem('chatwoot-user-storage');
          }
        },

        clearError: () => {
          set({ error: null });
        },
      };
    },
    {
      name: 'chatwoot-user-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isLoggedIn: state.isLoggedIn 
      }),
    }
  )
); 