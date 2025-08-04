'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getUserInboxes, getUserTeams } from '../../lib/api/chatwootAPI';

interface UserPermissionsInfoProps {
  onPermissionsLoaded?: (permissions: any) => void;
}

export default function UserPermissionsInfo({ onPermissionsLoaded }: UserPermissionsInfoProps) {
  const { user } = useUserStore();
  const [userInboxes, setUserInboxes] = useState<any[]>([]);
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!user?.auth_token || !user?.id) return;

      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Buscando permissões do usuário...');

        // Buscar inboxes e times do usuário
        const [inboxesResponse, teamsResponse] = await Promise.all([
          getUserInboxes(user.auth_token, user.id),
          getUserTeams(user.auth_token, user.id)
        ]);

        const inboxes = inboxesResponse.payload || [];
        const teams = teamsResponse.payload || [];

        setUserInboxes(inboxes);
        setUserTeams(teams);

        // Verificar se estamos em modo fallback (sem permissões específicas)
        if (inboxes.length === 0 && teams.length === 0) {
          setFallbackMode(true);
        }

        console.log('✅ Permissões carregadas:', {
          inboxes: inboxes.length,
          teams: teams.length,
          fallbackMode: inboxes.length === 0 && teams.length === 0
        });

        // Notificar componente pai sobre as permissões carregadas
        if (onPermissionsLoaded) {
          onPermissionsLoaded({
            inboxes,
            teams,
            role: user.role,
            fallbackMode: inboxes.length === 0 && teams.length === 0
          });
        }
      } catch (err) {
        console.error('❌ Erro ao carregar permissões:', err);
        setError('Erro ao carregar permissões');
        setFallbackMode(true);
        
        // Notificar componente pai mesmo com erro
        if (onPermissionsLoaded) {
          onPermissionsLoaded({
            inboxes: [],
            teams: [],
            role: user.role,
            fallbackMode: true,
            error: true
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [user?.auth_token, user?.id, onPermissionsLoaded]);

  if (loading) {
    return (
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Carregando permissões...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-yellow-800 dark:text-yellow-400">
              {user?.role === 'administrator' 
                ? 'Acesso completo a todas as conversas'
                : 'Modo de acesso ampliado - todas as conversas disponíveis'
              }
            </span>
          </div>
          
          <div className="relative group">
                      <button className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <div className="absolute right-0 top-8 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="text-xs">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Informação:</h4>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.role === 'administrator' 
                  ? 'Você tem acesso completo a todas as funcionalidades.'
                  : 'As permissões específicas não puderam ser carregadas. Você tem acesso a todas as conversas disponíveis.'
                }
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-4 py-3 border-b ${fallbackMode ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className={`w-4 h-4 ${fallbackMode ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`text-sm ${fallbackMode ? 'text-yellow-800 dark:text-yellow-400' : 'text-blue-800 dark:text-blue-400'}`}>
            {user?.role === 'administrator' ? (
              'Acesso completo a todas as conversas'
            ) : fallbackMode ? (
              'Modo de acesso ampliado - todas as conversas disponíveis'
            ) : (
              <>
                {userInboxes.length} inbox{userInboxes.length !== 1 ? 'es' : ''} • {userTeams.length} time{userTeams.length !== 1 ? 's' : ''}
              </>
            )}
          </span>
        </div>
        
        {/* Mostrar detalhes das permissões em tooltip ou expandir */}
        <div className="relative group">
          <button className={`${fallbackMode ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300' : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {/* Tooltip com detalhes */}
          <div className="absolute right-0 top-8 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="text-xs">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {fallbackMode ? 'Informação:' : 'Suas permissões:'}
              </h4>
              
              {user?.role === 'administrator' ? (
                <p className="text-gray-600 dark:text-gray-400">Você tem acesso completo a todas as funcionalidades.</p>
              ) : fallbackMode ? (
                <p className="text-gray-600 dark:text-gray-400">
                  As permissões específicas não puderam ser carregadas. Você tem acesso a todas as conversas disponíveis.
                </p>
              ) : (
                <div className="space-y-2">
                  {userInboxes.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Inboxes:</p>
                      <ul className="text-gray-600 dark:text-gray-400 ml-2">
                        {userInboxes.map((inbox: any) => (
                          <li key={inbox.id}>• {inbox.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {userTeams.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Times:</p>
                      <ul className="text-gray-600 dark:text-gray-400 ml-2">
                        {userTeams.map((team: any) => (
                          <li key={team.id}>• {team.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {userInboxes.length === 0 && userTeams.length === 0 && (
                    <p className="text-gray-600 dark:text-gray-400">Nenhuma permissão específica encontrada.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 