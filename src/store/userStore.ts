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
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => {
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
          console.log('🔄 [logout] Iniciando processo de logout...');
          
          // Limpar localStorage manualmente para garantir
          if (typeof window !== 'undefined') {
            console.log('🔄 [logout] Limpando localStorage...');
            localStorage.removeItem('chatwoot-user-storage');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_role');
          }
          
          // Limpar o estado
          console.log('🔄 [logout] Limpando estado...');
          set({ 
            user: null, 
            isLoggedIn: false, 
            isLoading: false,
            error: null 
          });
          
          // Redirecionar para a página inicial
          if (typeof window !== 'undefined') {
            console.log('🔄 [logout] Redirecionando para página inicial...');
            window.location.href = '/';
          }
        },

        clearError: () => {
          set({ error: null });
        },

        setUser: (user: User | null) => {
          set({ user });
          if (user?.auth_token) {
            localStorage.setItem('auth_token', user.auth_token);
            localStorage.setItem('user_role', user.role);
          } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_role');
          }
        },
      };
    },
    {
      name: 'chatwoot-user-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isLoggedIn: state.isLoggedIn 
      }),
      onRehydrateStorage: () => (state) => {
        // Verificar se o usuário ainda é válido ao reidratar
        if (state && state.user && !state.user.auth_token) {
          state.user = null;
          state.isLoggedIn = false;
        }
      },
    }
  )
); 