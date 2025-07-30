'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getAgents, getInboxes, getConversationStats } from '../../lib/api/chatwootAPI';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Users, MessageSquare, Mail, AlertTriangle, TrendingUp, 
  Clock, CheckCircle, XCircle, Activity, Eye, MessageCircle,
  Phone, Globe, Mail as MailIcon, Smartphone
} from 'lucide-react';
import RealTimeMetrics from './RealTimeMetrics';
import DashboardAlerts from './DashboardAlerts';

interface Agent {
  id: number;
  name: string;
  email: string;
  role: string;
  availability_status: string;
  confirmed: boolean;
  account_id: number;
  auto_offline: boolean;
  last_activity_at?: string;
}

interface Inbox {
  id: number;
  name: string;
  channel_type: string;
  status: string;
}

interface Conversation {
  id: number;
  inbox_id: number;
  status: string;
  unread_count: number;
  messages_count: number;
  last_activity_at: string;
  account_id: number;
  uuid: string;
  messages: any[];
  meta?: {
    sender?: any;
    channel?: string;
    assignee?: any;
    hmac_verified?: boolean;
  };
}

interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  unreadMessages: number;
  totalInboxes: number;
  activeInboxes: number;
}

export default function AdminDashboard() {
  const { user } = useUserStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Garantir que conversations seja sempre um array
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.auth_token) return;
      
      try {
        setLoading(true);
        const [agentsData, inboxesData, conversationsData] = await Promise.all([
          getAgents(user.auth_token),
          getInboxes(user.auth_token),
          getConversationStats(user.auth_token)
        ]);
        
        // Processar dados dos agentes
        const agentsList = Array.isArray(agentsData) ? agentsData : (agentsData.payload || agentsData.data || []);
        setAgents(agentsList);
        
        // Processar dados dos inboxes
        const inboxesList = inboxesData.payload || inboxesData.data || [];
        setInboxes(inboxesList);
        
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
        
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados. Verifique o console para mais detalhes.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.auth_token]);

  // Calcular estatísticas gerais
  const stats: DashboardStats = {
    totalAgents: agents.length,
    activeAgents: agents.filter(agent => agent.availability_status === 'online').length,
    totalConversations: safeConversations.length,
    activeConversations: safeConversations.filter(conv => conv.status === 'open').length,
    totalMessages: safeConversations.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0),
    unreadMessages: safeConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0),
    totalInboxes: inboxes.length,
    activeInboxes: inboxes.filter(inbox => inbox.status === 'active').length,
  };

  // Dados para gráficos
  const getConversationsByStatus = () => {
    const statusCount = safeConversations.reduce((acc, conv) => {
      acc[conv.status] = (acc[conv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Abertas', value: statusCount.open || 0, color: '#10B981' },
      { name: 'Resolvidas', value: statusCount.resolved || 0, color: '#3B82F6' },
      { name: 'Pendentes', value: statusCount.pending || 0, color: '#F59E0B' },
      { name: 'Fechadas', value: statusCount.closed || 0, color: '#6B7280' },
    ];
  };

  const getMessagesByDay = () => {
    // Dados reais baseados nas conversas existentes
    const today = new Date();
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    return days.map((day, index) => {
      const dayConversations = safeConversations.filter(conv => {
        const convDate = new Date(conv.last_activity_at);
        const diffDays = Math.floor((today.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays === index;
      });
      
      return {
        day,
        messages: dayConversations.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0),
        conversations: dayConversations.length,
      };
    });
  };

  const getInboxPerformance = () => {
    return inboxes.map(inbox => {
      const inboxConversations = safeConversations.filter(conv => conv.inbox_id === inbox.id);
      const totalMessages = inboxConversations.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0);
      const unreadMessages = inboxConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      
      return {
        name: inbox.name,
        status: inbox.status,
        channel_type: inbox.channel_type,
        conversations: inboxConversations.length,
        messages: totalMessages,
        unread: unreadMessages,
        efficiency: inboxConversations.length > 0 ? ((totalMessages - unreadMessages) / totalMessages * 100) : 0,
      };
    });
  };

  const getAgentActivity = () => {
    return agents.map(agent => ({
      name: agent.name,
      conversations: safeConversations.filter(conv => 
        conv.meta?.assignee?.id === agent.id
      ).length,
      status: agent.availability_status,
      confirmed: agent.confirmed,
    }));
  };

  const getChannelDistribution = () => {
    const channelCount = inboxes.reduce((acc, inbox) => {
      acc[inbox.channel_type] = (acc[inbox.channel_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(channelCount).map(([channel, count]) => ({
      name: channel,
      value: count,
    }));
  };



  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Header com filtros */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range as any)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                selectedTimeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas em Tempo Real */}
      <RealTimeMetrics refreshInterval={30000} />

      {/* Alertas do Sistema */}
      <DashboardAlerts />

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Agentes Ativos</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeAgents} / {stats.totalAgents}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Conversas Ativas</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeConversations} / {stats.totalConversations}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-yellow-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Não Respondidas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.unreadMessages}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-purple-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Inboxes Ativos</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeInboxes} / {stats.totalInboxes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Conversas por Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Conversas por Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getConversationsByStatus()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getConversationsByStatus().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Mensagens por Dia */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Atividade dos Últimos 7 Dias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getMessagesByDay()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="messages" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="conversations" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance dos Inboxes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Performance dos Inboxes</h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getInboxPerformance()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="conversations" fill="#8884d8" name="Conversas" />
              <Bar dataKey="messages" fill="#82ca9d" name="Mensagens" />
              <Bar dataKey="unread" fill="#ffc658" name="Não Lidas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribuição por Canal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Canal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getChannelDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getChannelDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Atividade dos Agentes */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Atividade dos Agentes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getAgentActivity()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="conversations" fill="#8884d8" name="Conversas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      
    </div>
  );
} 