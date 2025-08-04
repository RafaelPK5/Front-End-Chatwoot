'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getConversationCounts } from '../../lib/api/chatwootAPI';

interface ConversationStatsProps {
  onStatsLoaded?: (stats: any) => void;
}

export default function ConversationStats({ onStatsLoaded }: ConversationStatsProps) {
  const { user } = useUserStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.auth_token) return;

      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Buscando estatísticas das conversas...');

        const response = await getConversationCounts(user.auth_token);
        setStats(response.data);

        console.log('✅ Estatísticas carregadas:', response.data);

        if (onStatsLoaded) {
          onStatsLoaded(response.data);
        }
      } catch (err) {
        console.error('❌ Erro ao carregar estatísticas:', err);
        setError('Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Atualizar estatísticas a cada 60 segundos
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user?.auth_token, onStatsLoaded]);

  if (loading) {
    return (
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Carregando estatísticas...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return null; // Não mostrar nada em caso de erro
  }

  const { mine_count = 0, unassigned_count = 0, assigned_count = 0, all_count = 0 } = stats.meta || {};

  return (
    <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-green-800 dark:text-green-400">{all_count}</div>
          <div className="text-xs text-green-600 dark:text-green-400">Total</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-800 dark:text-blue-400">{mine_count}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Minhas</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">{assigned_count}</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400">Atribuídas</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-red-800 dark:text-red-400">{unassigned_count}</div>
          <div className="text-xs text-red-600 dark:text-red-400">Não atribuídas</div>
        </div>
      </div>
    </div>
  );
} 