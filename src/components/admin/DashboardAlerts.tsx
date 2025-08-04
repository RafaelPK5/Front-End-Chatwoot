'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getConversationStats, getAgents } from '../../lib/api/chatwootAPI';
import { 
  AlertTriangle, Clock, Users, MessageSquare, 
  CheckCircle, XCircle, Info, Zap 
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
}

export default function DashboardAlerts() {
  const { user } = useUserStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const generateAlerts = async () => {
    if (!user?.auth_token) return;
    
    try {
      setLoading(true);
      const [conversationsData, agentsData] = await Promise.all([
        getConversationStats(user.auth_token),
        getAgents(user.auth_token)
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

      const newAlerts: Alert[] = [];

      // Verificar conversas não respondidas há muito tempo
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

      // Verificar agentes offline
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

      // Verificar alta demanda
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

      // Verificar eficiência baixa
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
      console.error('Erro ao gerar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateAlerts();
    const interval = setInterval(generateAlerts, 60000); // Atualizar a cada minuto
    return () => clearInterval(interval);
  }, [user?.auth_token]);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (alerts.length === 0 && !loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Alertas do Sistema</h3>
          <Zap className="h-5 w-5 text-green-500" />
        </div>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-500">Tudo funcionando perfeitamente!</p>
          <p className="text-sm text-gray-400 mt-1">Nenhum alerta ativo no momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Alertas do Sistema</h3>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-1 w-1 text-yellow-500" />
          <span className="text-sm text-gray-500">{alerts.length} alertas ativos</span>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-1 ${getAlertColor(alert.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium">{alert.title}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(alert.priority)}`}>
                      {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {alert.timestamp.toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Verificando alertas...</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Alta Prioridade</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Média Prioridade</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Baixa Prioridade</span>
            </div>
          </div>
          <button
            onClick={generateAlerts}
            disabled={loading}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
} 