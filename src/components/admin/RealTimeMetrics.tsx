'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../../store/userStore';
import { getConversationStats, getAgents, getEvolutionInstances } from '../../lib/api/chatwootAPI';
import { 
  Activity, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle, Wifi, WifiOff 
} from 'lucide-react';

interface RealTimeMetricsProps {
  refreshInterval?: number; // em milissegundos
}

export default function RealTimeMetrics({ refreshInterval = 30000 }: RealTimeMetricsProps) {
  const { user } = useUserStore();
  const [metrics, setMetrics] = useState({
    unreadConversations: 0,
    onlineAgents: 0,
    offlineAgents: 0,
    activeInboxes: 0,
    lastUpdate: new Date(),
  });
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    if (!user?.auth_token) return;
    
    try {
      setLoading(true);
      const [conversationsData, agentsData, evolutionData] = await Promise.all([
        getConversationStats(user.auth_token),
        getAgents(user.auth_token),
        getEvolutionInstances(user.auth_token)
      ]);

      // Processar dados das conversas
      let conversationsList: any[] = [];
      if (Array.isArray(conversationsData)) {
        conversationsList = conversationsData;
      } else if (conversationsData && typeof conversationsData === 'object') {
        conversationsList = conversationsData.data?.payload || conversationsData.payload || conversationsData.data || [];
      }

      // Processar dados dos agentes
      const agentsList = Array.isArray(agentsData) ? agentsData : (agentsData.payload || agentsData.data || []);

      // Processar dados da Evolution API
      const instancesList = evolutionData.instances || [];

      // Calcular métricas reais
      const unreadConversations = conversationsList.filter((conv: any) => conv.unread_count > 0).length;
      const onlineAgents = agentsList.filter((agent: any) => agent.availability_status === 'online').length;
      const offlineAgents = agentsList.filter((agent: any) => agent.availability_status !== 'online').length;
      
      const activeInboxes = instancesList.filter((instance: any) => 
        instance.connectionStatus === 'open' || instance.connectionStatus === 'connecting'
      ).length;

      setMetrics({
        unreadConversations,
        onlineAgents,
        offlineAgents,
        activeInboxes,
        lastUpdate: new Date(),
      });
    } catch (error) {
      console.error('Erro ao buscar métricas em tempo real:', error);
      
      // Se houver erro, usar valores padrão para evitar quebra da interface
      setMetrics({
        unreadConversations: 0,
        onlineAgents: 0,
        offlineAgents: 0,
        activeInboxes: 0,
        lastUpdate: new Date(),
      });
    } finally {
      setLoading(false);
    }
  }, [user?.auth_token]);

  useEffect(() => {
    if (user?.auth_token) {
      fetchMetrics();
    }
    
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval, user?.auth_token]);

  const getTrendIcon = (value: number, threshold: number) => {
    if (value > threshold) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (value < threshold) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Métricas em Tempo Real</h3>
        <div className="flex items-center space-x-2">
          <Activity className={`h-4 w-4 ${loading ? 'animate-spin text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Última atualização: {metrics.lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Conversas Não Respondidas */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Não Respondidas</p>
              <p className="text-2xl font-bold text-red-900">{metrics.unreadConversations}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div className="flex items-center mt-2">
            {getTrendIcon(metrics.unreadConversations, 3)}
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              {metrics.unreadConversations > 3 ? 'Atenção' : 'Normal'}
            </span>
          </div>
        </div>

        {/* Agentes Online */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Agentes Online</p>
              <p className="text-2xl font-bold text-green-900">{metrics.onlineAgents}</p>
            </div>
            <Wifi className="h-8 w-8 text-green-500" />
          </div>
          <div className="flex items-center mt-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">Disponível</span>
          </div>
        </div>

        {/* Agentes Offline */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Agentes Offline</p>
              <p className="text-2xl font-bold text-orange-900">{metrics.offlineAgents}</p>
            </div>
            <WifiOff className="h-8 w-8 text-orange-500" />
          </div>
          <div className="flex items-center mt-2">
            <Activity className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">Indisponível</span>
          </div>
        </div>

        {/* Inboxes Ativos */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Inboxes Ativos</p>
              <p className="text-2xl font-bold text-purple-900">{metrics.activeInboxes}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-500" />
          </div>
          <div className="flex items-center mt-2">
            <Activity className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">Evolution API</span>
          </div>
        </div>
      </div>

      {/* Indicador de Eficiência */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Eficiência do Sistema</p>
            <div className="flex items-center mt-1">
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-3 mr-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full" 
                    style={{ width: `${Math.min((metrics.onlineAgents / Math.max(metrics.onlineAgents + metrics.offlineAgents, 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round((metrics.onlineAgents / Math.max(metrics.onlineAgents + metrics.offlineAgents, 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">{metrics.onlineAgents}/{metrics.onlineAgents + metrics.offlineAgents} agentes ativos</p>
          </div>
        </div>
      </div>

      {/* Status do Sistema */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-300">Sistema Online</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-300">API Conectada</span>
          </div>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>
    </div>
  );
} 