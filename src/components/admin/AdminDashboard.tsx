'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getAgents, getConversationStats, getEvolutionInstances } from '../../lib/api/chatwootAPI';
import RealTimeMetrics from './RealTimeMetrics';
import DashboardCharts from './DashboardCharts';

interface Agent {
  id: number;
  name: string;
  email: string;
  role: string;
  availability_status: string;
  confirmed: boolean;
  account_id: number;
  auto_offline: boolean;
}

interface Conversation {
  id: number;
  inbox_id: number;
  status: string;
  unread_count: number;
  messages_count: number;
  last_activity_at: string;
}

export default function AdminDashboard() {
  const { user } = useUserStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [evolutionInstances, setEvolutionInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Garantir que conversations seja sempre um array
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.auth_token) return;
      
      try {
        setLoading(true);
        const [agentsData, conversationsData, evolutionData] = await Promise.all([
          getAgents(user.auth_token),
          getConversationStats(user.auth_token),
          getEvolutionInstances(user.auth_token)
        ]);
        
        // Processar dados dos agentes
        const agentsList = Array.isArray(agentsData) ? agentsData : (agentsData.payload || agentsData.data || []);
        setAgents(agentsList);
        
        // Processar dados das conversas
        let conversationsList = [];
        if (Array.isArray(conversationsData)) {
          conversationsList = conversationsData;
        } else if (conversationsData && typeof conversationsData === 'object') {
          conversationsList = conversationsData.data?.payload || conversationsData.payload || conversationsData.data || [];
        }
        
        if (!Array.isArray(conversationsList)) {
          console.warn('⚠️ Dados de conversas não são um array:', conversationsList);
          conversationsList = [];
        }
        
        setConversations(conversationsList);
        
        // Processar dados da Evolution API
        const instancesList = evolutionData.instances || [];
        setEvolutionInstances(instancesList);
        
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados. Verifique o console para mais detalhes.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.auth_token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Métricas em Tempo Real */}
      <RealTimeMetrics />

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total de Agentes</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">{agents.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Conversas Ativas</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">{safeConversations.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total de Mensagens</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">{safeConversations.reduce((sum, conv) => sum + (conv.messages_count || 0), 0)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Não Respondidas</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">{safeConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráficos com dados da API */}
      <DashboardCharts agents={agents} conversations={conversations} evolutionInstances={evolutionInstances} />
    </div>
  );
} 