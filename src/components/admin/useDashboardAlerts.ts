import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getConversationStats, getAgents } from '../../lib/api/chatwootAPI';

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
}

export function useDashboardAlerts() {
  const { user } = useUserStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.auth_token) {
      generateAlerts();
      const interval = setInterval(generateAlerts, 60000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line
  }, [user?.auth_token]);

  const generateAlerts = async () => {
    if (!user?.auth_token) return;
    try {
      setLoading(true);
      const [conversationsData, agentsData] = await Promise.all([
        getConversationStats(user.auth_token),
        getAgents(user.auth_token)
      ]);
      let conversationsList: any[] = [];
      if (Array.isArray(conversationsData)) {
        conversationsList = conversationsData;
      } else if (conversationsData && typeof conversationsData === 'object') {
        conversationsList = conversationsData.data?.payload || conversationsData.payload || conversationsData.data || [];
      }
      const agentsList = Array.isArray(agentsData) ? agentsData : (agentsData.payload || agentsData.data || []);
      const newAlerts: Alert[] = [];
      // Conversas não respondidas
      const unreadConversations = conversationsList.filter((conv: any) => conv.unread_count > 0);
      if (unreadConversations.length > 5) {
        newAlerts.push({
          id: 'unread-conversations',
          type: 'warning',
          title: 'Conversas Não Respondidas',
          message: `${unreadConversations.length} conversas aguardando resposta há mais de 2 horas`,
          timestamp: new Date(),
          priority: 'high'
        });
      }
      // Agentes offline
      const offlineAgents = agentsList.filter((agent: any) => agent.availability_status !== 'online');
      if (offlineAgents.length > 0) {
        newAlerts.push({
          id: 'offline-agents',
          type: 'info',
          title: 'Agentes Offline',
          message: `${offlineAgents.length} agentes estão offline`,
          timestamp: new Date(),
          priority: 'medium'
        });
      }
      // Alta demanda
      if (conversationsList.length > 20) {
        newAlerts.push({
          id: 'high-demand',
          type: 'warning',
          title: 'Alta Demanda',
          message: 'Volume de conversas acima do normal. Considere adicionar mais agentes.',
          timestamp: new Date(),
          priority: 'medium'
        });
      }
      // Eficiência baixa
      const onlineAgents = agentsList.filter((agent: any) => agent.availability_status === 'online').length;
      const efficiencyRate = (onlineAgents / Math.max(agentsList.length, 1)) * 100;
      if (efficiencyRate < 50) {
        newAlerts.push({
          id: 'low-efficiency',
          type: 'warning',
          title: 'Eficiência Baixa',
          message: `Apenas ${Math.round(efficiencyRate)}% dos agentes estão online`,
          timestamp: new Date(),
          priority: 'medium'
        });
      }
      setAlerts(newAlerts);
    } catch (error) {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  return { alerts, loading };
}