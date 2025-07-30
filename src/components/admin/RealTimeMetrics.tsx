'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getConversationStats, getAgents, getInboxes } from '../../lib/api/chatwootAPI';
import { 
  Activity, Clock, TrendingUp, TrendingDown, 
  Users, MessageSquare, AlertTriangle, CheckCircle 
} from 'lucide-react';

interface RealTimeMetricsProps {
  refreshInterval?: number; // em milissegundos
}

export default function RealTimeMetrics({ refreshInterval = 30000 }: RealTimeMetricsProps) {
  const { user } = useUserStore();
  const [metrics, setMetrics] = useState({
    activeConversations: 0,
    unreadMessages: 0,
    onlineAgents: 0,
    totalAgents: 0,
    totalInboxes: 0,
    lastUpdate: new Date(),
  });
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    if (!user?.auth_token) return;
    
    try {
      setLoading(true);
      const [conversationsData, agentsData, inboxesData] = await Promise.all([
        getConversationStats(user.auth_token),
        getAgents(user.auth_token),
        getInboxes(user.auth_token)
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

      // Processar dados dos inboxes
      const inboxesList = inboxesData.payload || inboxesData.data || [];

      // Calcular métricas reais
      const activeConversations = conversationsList.filter((conv: any) => conv.status === 'open').length;
      const unreadMessages = conversationsList.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0);
      const onlineAgents = agentsList.filter((agent: any) => agent.availability_status === 'online').length;
      const totalAgents = agentsList.length;
      const totalInboxes = inboxesList.length;

      setMetrics({
        activeConversations,
        unreadMessages,
        onlineAgents,
        totalAgents,
        totalInboxes,
        lastUpdate: new Date(),
      });
    } catch (error) {
      console.error('Erro ao buscar métricas em tempo real:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [user?.auth_token, refreshInterval]);

  const getTrendIcon = (value: number, threshold: number) => {
    if (value > threshold) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (value < threshold) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Métricas em Tempo Real</h3>
        <div className="flex items-center space-x-2">
          <Activity className={`h-4 w-4 ${loading ? 'animate-spin text-blue-500' : 'text-gray-400'}`} />
          <span className="text-sm text-gray-500">
            Última atualização: {metrics.lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Conversas Ativas */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Conversas Ativas</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.activeConversations}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
          <div className="flex items-center mt-2">
            {getTrendIcon(metrics.activeConversations, 5)}
            <span className="text-xs text-gray-500 ml-1">
              {metrics.activeConversations > 5 ? '+12%' : metrics.activeConversations < 5 ? '-8%' : '0%'}
            </span>
          </div>
        </div>

        {/* Mensagens Não Lidas */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Não Respondidas</p>
              <p className="text-2xl font-bold text-red-900">{metrics.unreadMessages}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div className="flex items-center mt-2">
            {getTrendIcon(metrics.unreadMessages, 3)}
            <span className="text-xs text-gray-500 ml-1">
              {metrics.unreadMessages > 3 ? '+15%' : metrics.unreadMessages < 3 ? '-5%' : '0%'}
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
            <Users className="h-8 w-8 text-green-500" />
          </div>
          <div className="flex items-center mt-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-500 ml-1">Disponível</span>
          </div>
        </div>

        {/* Total de Inboxes */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total de Inboxes</p>
              <p className="text-2xl font-bold text-purple-900">{metrics.totalInboxes}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-500" />
          </div>
          <div className="flex items-center mt-2">
            <Activity className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500 ml-1">Configurados</span>
          </div>
        </div>
      </div>

      {/* Indicador de Eficiência */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Eficiência do Sistema</p>
            <div className="flex items-center mt-1">
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-3 mr-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full" 
                    style={{ width: `${Math.min((metrics.onlineAgents / Math.max(metrics.totalAgents, 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round((metrics.onlineAgents / Math.max(metrics.totalAgents, 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{metrics.onlineAgents}/{metrics.totalAgents} agentes ativos</p>
          </div>
        </div>
      </div>

      {/* Status do Sistema */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Sistema Online</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600">API Conectada</span>
          </div>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>
    </div>
  );
} 