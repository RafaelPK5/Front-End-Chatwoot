'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getAgents, createAgent, updateAgent, deleteAgent } from '../../lib/api/chatwootAPI';

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

interface AgentFormData {
  name: string;
  email: string;
  role: string;
  password?: string;
}

export default function AgentManagement() {
  const { user } = useUserStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    email: '',
    role: 'agent'
  });

  useEffect(() => {
    if (user?.auth_token) {
      fetchAgents();
    } else {
      setLoading(false);
      setError('Usuário não autenticado');
    }
  }, [user?.auth_token]);

  const fetchAgents = async () => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const agentsData = await getAgents(user.auth_token);
      
      // Processar dados dos agentes
      let agentsList = [];
      if (Array.isArray(agentsData)) {
        agentsList = agentsData;
      } else if (agentsData && typeof agentsData === 'object') {
        agentsList = agentsData.payload || agentsData.data || [];
      }
      
      if (!Array.isArray(agentsList)) {
        console.warn('Dados de agentes não são um array:', agentsList);
        agentsList = [];
      }
      
      setAgents(agentsList);
    } catch (err: any) {
      console.error('Erro ao carregar agentes:', err);
      setError(err.message || 'Erro ao carregar agentes. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      return;
    }
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Nome e email são obrigatórios');
      return;
    }
    
    if (!formData.password || formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    try {
      setError(null);
      // Garante que password nunca será undefined
      await createAgent(user.auth_token, {
        ...formData,
        password: formData.password ?? ''
      });
      setShowCreateModal(false);
      setFormData({ name: '', email: '', role: 'agent' });
      fetchAgents();
    } catch (err: any) {
      console.error('Erro ao criar agente:', err);
      setError(err.message || 'Erro ao criar agente. Verifique o console para mais detalhes.');
    }
  };

  const handleEditAgent = async () => {
    if (!user?.auth_token || !editingAgent) {
      setError('Token de autenticação não encontrado ou agente não selecionado');
      return;
    }
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Nome e email são obrigatórios');
      return;
    }
    
    try {
      setError(null);
      await updateAgent(user.auth_token, editingAgent.id, formData);
      setShowEditModal(false);
      setEditingAgent(null);
      setFormData({ name: '', email: '', role: 'agent' });
      fetchAgents();
    } catch (err: any) {
      console.error('Erro ao atualizar agente:', err);
      setError(err.message || 'Erro ao atualizar agente. Verifique o console para mais detalhes.');
    }
  };

  const handleDeleteAgent = async (agentId: number) => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      return;
    }
    
    if (!confirm('Tem certeza que deseja deletar este agente?')) return;
    
    try {
      setError(null);
      await deleteAgent(user.auth_token, agentId);
      fetchAgents();
    } catch (err: any) {
      console.error('Erro ao deletar agente:', err);
      setError(err.message || 'Erro ao deletar agente. Verifique o console para mais detalhes.');
    }
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email,
      role: agent.role
    });
    setShowEditModal(true);
  };

  // Filtrar agentes
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || agent.role === filterRole;
    const matchesStatus = filterStatus === 'all' || agent.availability_status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Estatísticas
  const totalAgents = agents.length;
  const onlineAgents = agents.filter(agent => agent.availability_status === 'online').length;
  const confirmedAgents = agents.filter(agent => agent.confirmed).length;
  const adminAgents = agents.filter(agent => agent.role === 'administrator').length;

  // Se não há usuário autenticado
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Usuário não autenticado</h3>
          <p className="text-gray-500">Faça login para acessar esta página</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Agentes</h1>
          <p className="text-gray-600">Gerencie os agentes da sua empresa</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Novo Agente
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total de Agentes</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalAgents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Online</dt>
                  <dd className="text-lg font-medium text-green-600">{onlineAgents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Confirmados</dt>
                  <dd className="text-lg font-medium text-blue-600">{confirmedAgents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Administradores</dt>
                  <dd className="text-lg font-medium text-purple-600">{adminAgents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              placeholder="Nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Função
            </label>
            <select
              id="role"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
            >
              <option value="all" className="text-gray-900 bg-white hover:bg-gray-100">Todas as funções</option>
              <option value="administrator" className="text-gray-900 bg-white hover:bg-gray-100">Administrador</option>
              <option value="agent" className="text-gray-900 bg-white hover:bg-gray-100">Agente</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
            >
              <option value="all" className="text-gray-900 bg-white hover:bg-gray-100">Todos os status</option>
              <option value="online" className="text-gray-900 bg-white hover:bg-gray-100">Online</option>
              <option value="offline" className="text-gray-900 bg-white hover:bg-gray-100">Offline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Agentes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Agentes ({filteredAgents.length} de {totalAgents})
          </h3>
          
          {filteredAgents.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agente encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">Comece criando seu primeiro agente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confirmado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {agent.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.role === 'administrator' ? 'Administrador' : 'Agente'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          agent.availability_status === 'online' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {agent.availability_status === 'online' ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          agent.confirmed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {agent.confirmed ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(agent)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteAgent(agent.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Agente</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Nome do agente"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Senha (mínimo 6 caracteres)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Função</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                >
                  <option value="agent" className="text-gray-900 bg-white hover:bg-gray-100">Agente</option>
                  <option value="administrator" className="text-gray-900 bg-white hover:bg-gray-100">Administrador</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAgent}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Agente</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Nome do agente"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Nova Senha (opcional)</label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Deixe em branco para manter a senha atual"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Função</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                >
                  <option value="agent" className="text-gray-900 bg-white hover:bg-gray-100">Agente</option>
                  <option value="administrator" className="text-gray-900 bg-white hover:bg-gray-100">Administrador</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditAgent}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 