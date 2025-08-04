'use client';

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';

interface Agent {
  id: number;
  name: string;
  email: string;
  role: string;
  available_name: string;
  confirmed: boolean;
  accounts: Array<{
    id: number;
    role: string;
    permissions: string[];
  }>;
}

interface Team {
  id: number;
  name: string;
  description?: string;
  members_count?: number;
}

interface Inbox {
  id: number;
  name: string;
  channel_type: string;
  platform_type?: string;
  account_id: number;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface InboxAgent {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AllocationManagement() {
  const { user } = useUserStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'teams' | 'inboxes'>('teams');
  
  // Estados para times
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableAgentsForTeam, setAvailableAgentsForTeam] = useState<Agent[]>([]);
  const [showTeamAllocationModal, setShowTeamAllocationModal] = useState(false);
  
  // Estados para inboxes
  const [selectedInbox, setSelectedInbox] = useState<Inbox | null>(null);
  const [inboxAgents, setInboxAgents] = useState<InboxAgent[]>([]);
  const [availableAgentsForInbox, setAvailableAgentsForInbox] = useState<Agent[]>([]);
  const [showInboxAllocationModal, setShowInboxAllocationModal] = useState(false);

  // Buscar dados iniciais
  const fetchInitialData = async () => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar agentes, times e inboxes em paralelo
      const [agentsResponse, teamsResponse, inboxesResponse] = await Promise.all([
        fetch('/api/chatwoot/api/v1/accounts/1/agents', {
          headers: { 'api_access_token': user.auth_token }
        }),
        fetch('/api/chatwoot/api/v1/accounts/1/teams', {
          headers: { 'api_access_token': user.auth_token }
        }),
        fetch('/api/chatwoot/api/v1/accounts/1/inboxes', {
          headers: { 'api_access_token': user.auth_token }
        })
      ]);

      if (!agentsResponse.ok || !teamsResponse.ok || !inboxesResponse.ok) {
        throw new Error('Erro ao buscar dados iniciais');
      }

      const [agentsData, teamsData, inboxesData] = await Promise.all([
        agentsResponse.json(),
        teamsResponse.json(),
        inboxesResponse.json()
      ]);

      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : teamsData.payload || []);
      setInboxes(Array.isArray(inboxesData) ? inboxesData : inboxesData.payload || []);
    } catch (err: any) {
      console.error('❌ Erro ao buscar dados iniciais:', err);
      setError(err.message || 'Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  // Buscar membros de um time
  const fetchTeamMembers = async (teamId: number) => {
    if (!user?.auth_token) return;

    try {
      // Tentar diferentes formatos de endpoint baseado na documentação da API
      const endpoints = [
        `/api/chatwoot/api/v1/accounts/1/teams/${teamId}/team_members`,
        `/api/chatwoot/api/v1/accounts/1/teams/${teamId}/team_member`,
        `/api/chatwoot/api/v1/accounts/1/teams/${teamId}/agents`,
        `/api/chatwoot/api/v1/accounts/1/teams/${teamId}/members`,
        `/api/chatwoot/api/v1/accounts/1/teams/${teamId}/team_members`
      ];
      
      let data = null;
      let success = false;
      
      for (let i = 0; i < endpoints.length; i++) {
        try {
          const response = await fetch(endpoints[i], {
            headers: { 'api_access_token': user.auth_token }
          });

          if (response.ok) {
            data = await response.json();
            success = true;
            break;
          }
        } catch (err: any) {
          // Silenciar erros de endpoint
        }
      }
      
      if (success && data) {
        setTeamMembers(Array.isArray(data) ? data : []);
        
        // Calcular agentes disponíveis (não estão no time)
        const teamMemberIds = (Array.isArray(data) ? data : []).map((member: any) => member.id);
        const available = agents.filter(agent => !teamMemberIds.includes(agent.id));
        setAvailableAgentsForTeam(available);
      } else {
        setTeamMembers([]);
        setAvailableAgentsForTeam(agents);
      }
    } catch (err: any) {
      console.error('❌ Erro ao buscar membros do time:', err);
      setTeamMembers([]);
      setAvailableAgentsForTeam(agents);
    }
  };

  // Buscar agentes de um inbox
  const fetchInboxAgents = async (inboxId: number) => {
    if (!user?.auth_token) return;

    try {
      // Usar o endpoint correto da documentação oficial do Chatwoot
      const endpoint = `/api/chatwoot/api/v1/accounts/1/inbox_members/${inboxId}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': user.auth_token
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // A resposta deve ter a estrutura { payload: [...] } conforme documentação
        if (data.payload && Array.isArray(data.payload)) {
          const inboxAgentsData = data.payload.map((agent: any) => ({
            id: agent.id,
            name: agent.name || agent.available_name || agent.email,
            email: agent.email,
            role: agent.role || 'agent'
          }));
          
          setInboxAgents(inboxAgentsData);
          
          // Filtrar agentes que não estão no inbox
          const availableAgents = agents.filter(agent => 
            !inboxAgentsData.some((inboxAgent: InboxAgent) => inboxAgent.id === agent.id)
          );
          setAvailableAgentsForInbox(availableAgents);
        } else {
          setInboxAgents([]);
          setAvailableAgentsForInbox(agents);
        }
      } else {
        console.error('❌ Erro ao buscar agentes do inbox:', response.status, response.statusText);
        setInboxAgents([]);
        setAvailableAgentsForInbox(agents);
      }
    } catch (err: any) {
      console.error('❌ Erro ao buscar agentes do inbox:', err);
      setInboxAgents([]);
      setAvailableAgentsForInbox(agents);
    }
  };

  // Adicionar agente ao time
  const addAgentToTeam = async (agentId: number) => {
    if (!user?.auth_token || !selectedTeam) return;

    try {
      setError(null);
      
      // Tentar diferentes formatos de endpoint baseado na documentação da API
      const endpoints = [
        `/api/chatwoot/api/v1/accounts/1/teams/${selectedTeam.id}/team_members`,
        `/api/chatwoot/api/v1/accounts/1/teams/${selectedTeam.id}/team_member`,
        `/api/chatwoot/api/v1/accounts/1/teams/${selectedTeam.id}/agents`,
        `/api/chatwoot/api/v1/accounts/1/teams/${selectedTeam.id}/members`,
        `/api/chatwoot/api/v1/accounts/1/teams/${selectedTeam.id}/team_members`
      ];
      
      const payloads = [
        { user_ids: [agentId] }, // Correct format according to Chatwoot API docs
        { user_ids: [agentId.toString()] },
        { user_id: agentId }, // Fallback to old format
        { user_id: agentId.toString() },
        { userid: agentId },
        { userid: agentId.toString() },
        { agent_id: agentId },
        { agent_id: agentId.toString() },
        { user_id: parseInt(agentId.toString()) },
        { user_id: String(agentId) },
        { user_id: Number(agentId) }
      ];
      
      let success = false;
      let lastError = null;
      
      for (let i = 0; i < Math.min(endpoints.length, payloads.length); i++) {
        try {
          const response = await fetch(endpoints[i], {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api_access_token': user.auth_token
            },
            body: JSON.stringify(payloads[i])
          });

          if (response.ok) {
            success = true;
            break;
          } else {
            const errorData = await response.json().catch(() => ({}));
            lastError = errorData.error || `Erro ${response.status}: ${response.statusText}`;
          }
        } catch (err: any) {
          lastError = err.message;
        }
      }
      
      if (!success) {
        throw new Error(lastError || 'Todos os endpoints falharam');
      }
      
      // Recarregar membros do time
      await fetchTeamMembers(selectedTeam.id);
    } catch (err: any) {
      console.error('❌ Erro ao adicionar agente ao time:', err);
      setError(err.message || 'Erro ao adicionar agente ao time');
    }
  };

  // Remover agente do time
  const removeAgentFromTeam = async (agentId: number) => {
    if (!user?.auth_token || !selectedTeam) return;

    if (!confirm('Tem certeza que deseja remover este agente do time?')) return;

    try {
      setError(null);
      
      // Usar o endpoint correto conforme documentação da API
      const endpoint = `/api/chatwoot/api/v1/accounts/1/teams/${selectedTeam.id}/team_members`;
      
      // Payload correto conforme documentação: {"user_ids": [123]}
      const payload = { user_ids: [agentId] };
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': user.auth_token
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Recarregar membros do time
        await fetchTeamMembers(selectedTeam.id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('❌ Erro ao remover agente do time:', err);
      setError(err.message || 'Erro ao remover agente do time');
    }
  };

  // Adicionar agente ao inbox
  const addAgentToInbox = async (agentId: number) => {
    if (!user?.auth_token || !selectedInbox) return;

    try {
      setError(null);
      
      // Endpoint correto conforme documentação da API
      const endpoint = `/api/chatwoot/api/v1/accounts/1/inbox_members`;
      
      // Payload correto conforme documentação: {"inbox_id": 1, "user_ids": [1]}
      const payload = { 
        inbox_id: selectedInbox.id, 
        user_ids: [agentId] 
      };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': user.auth_token
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Recarregar agentes do inbox
        await fetchInboxAgents(selectedInbox.id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }
      
    } catch (err: any) {
      console.error('❌ Erro ao adicionar agente ao inbox:', err);
      setError(err.message || 'Erro ao adicionar agente ao inbox');
    }
  };

  // Remover agente do inbox
  const removeAgentFromInbox = async (agentId: number) => {
    if (!user?.auth_token || !selectedInbox) return;

    if (!confirm('Tem certeza que deseja remover este agente do inbox?')) return;

    try {
      setError(null);
      
      // Endpoint correto conforme documentação da API
      const endpoint = `/api/chatwoot/api/v1/accounts/1/inbox_members`;
      
      // Payload correto conforme documentação: {"inbox_id": "<string>", "user_ids": [123]}
      const payload = { 
        inbox_id: selectedInbox.id.toString(), 
        user_ids: [agentId] 
      };
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': user.auth_token
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Recarregar agentes do inbox
        await fetchInboxAgents(selectedInbox.id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }
      
    } catch (err: any) {
      console.error('❌ Erro ao remover agente do inbox:', err);
      setError(err.message || 'Erro ao remover agente do inbox');
    }
  };

  // Selecionar time
  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    fetchTeamMembers(team.id);
    setShowTeamAllocationModal(true);
  };

  // Selecionar inbox
  const handleInboxSelect = (inbox: Inbox) => {
    setSelectedInbox(inbox);
    fetchInboxAgents(inbox.id);
    setShowInboxAllocationModal(true);
  };

  useEffect(() => {
    fetchInitialData();
  }, [user?.auth_token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <img 
            src="/logo-communica.png" 
            alt="Communica Logo" 
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciamento de Alocações</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Aloque agentes para times e inboxes</p>
          </div>
        </div>
      </div>

      {/* Alertas de erro */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Erro</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{agents.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total de Agentes</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{teams.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total de Times</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{inboxes.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total de Inboxes</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {teams.reduce((total, team) => total + (team.members_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Alocações Ativas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('teams')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teams'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Alocações por Time
            </button>
            <button
              onClick={() => setActiveTab('inboxes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inboxes'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              Alocações por Inbox
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'teams' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                     <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
             <h2 className="text-lg font-medium text-gray-900 dark:text-white">Times</h2>
             <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Clique em um time para gerenciar suas alocações</p>
           </div>
          
          {teams.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum time encontrado</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Crie times primeiro para gerenciar alocações.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nome do Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Membros
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {teams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{team.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {team.description || 'Sem descrição'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{team.members_count || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleTeamSelect(team)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Gerenciar Alocações
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inboxes' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Inboxes</h2>
            <p className="text-sm text-gray-600 mt-1">Clique em um inbox para gerenciar suas alocações</p>
          </div>
          
          {inboxes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum inbox encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">Crie inboxes primeiro para gerenciar alocações.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome do Inbox
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Canal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Plataforma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inboxes.map((inbox) => (
                    <tr key={inbox.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{inbox.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{inbox.channel_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{inbox.platform_type || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleInboxSelect(inbox)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Gerenciar Alocações
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Alocação de Time */}
      {showTeamAllocationModal && selectedTeam && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Gerenciar Alocações - {selectedTeam.name}
                </h3>
                <button
                  onClick={() => setShowTeamAllocationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Membros Atuais */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Membros Atuais ({teamMembers.length})</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {teamMembers.length === 0 ? (
                      <p className="text-gray-500 text-sm">Nenhum membro alocado</p>
                    ) : (
                      <div className="space-y-2">
                        {teamMembers.map((member) => (
                          <div key={member.id} className="flex justify-between items-center p-2 bg-white rounded border">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                            </div>
                            <button
                              onClick={() => removeAgentFromTeam(member.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Agentes Disponíveis */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Agentes Disponíveis ({availableAgentsForTeam.length})</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {availableAgentsForTeam.length === 0 ? (
                      <p className="text-gray-500 text-sm">Todos os agentes já estão alocados</p>
                    ) : (
                      <div className="space-y-2">
                        {availableAgentsForTeam.map((agent) => (
                          <div key={agent.id} className="flex justify-between items-center p-2 bg-white rounded border">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                              <div className="text-xs text-gray-500">{agent.email}</div>
                            </div>
                            <button
                              onClick={() => addAgentToTeam(agent.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Adicionar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alocação de Inbox */}
      {showInboxAllocationModal && selectedInbox && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Gerenciar Alocações - {selectedInbox.name}
                </h3>
                <button
                  onClick={() => setShowInboxAllocationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Agentes Atuais */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Agentes Atuais ({inboxAgents.length})</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {inboxAgents.length === 0 ? (
                      <p className="text-gray-500 text-sm">Nenhum agente alocado</p>
                    ) : (
                      <div className="space-y-2">
                        {inboxAgents.map((agent) => (
                          <div key={agent.id} className="flex justify-between items-center p-2 bg-white rounded border">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                              <div className="text-xs text-gray-500">{agent.email}</div>
                            </div>
                            <button
                              onClick={() => removeAgentFromInbox(agent.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Agentes Disponíveis */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Agentes Disponíveis ({availableAgentsForInbox.length})</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {availableAgentsForInbox.length === 0 ? (
                      <p className="text-gray-500 text-sm">Todos os agentes já estão alocados</p>
                    ) : (
                      <div className="space-y-2">
                        {availableAgentsForInbox.map((agent) => (
                          <div key={agent.id} className="flex justify-between items-center p-2 bg-white rounded border">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                              <div className="text-xs text-gray-500">{agent.email}</div>
                            </div>
                            <button
                              onClick={() => addAgentToInbox(agent.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Adicionar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 