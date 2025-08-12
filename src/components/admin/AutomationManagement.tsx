"use client";

import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getAgents, getInboxes, getTeams, getAutomations, createAutomation, updateAutomation, deleteAutomation } from '../../lib/api/chatwootAPI';

interface Agent {
  id: number;
  name: string;
  email: string;
  role: string;
  availability_status: string;
  confirmed: boolean;
}

interface Inbox {
  id: number;
  name: string;
  channel_type: string;
  status: string;
}

interface Team {
  id: number;
  name: string;
  description?: string;
}

interface AutomationRule {
  id: number;
  account_id: number;
  name: string;
  description: string;
  event_name: string;
  conditions: Array<{
    values: any[];
    attribute_key: string;
    filter_operator: string;
    custom_attribute_type: string;
  }>;
  actions: Array<{
    action_name: string;
    action_params: any[];
  }>;
  created_on: number;
  active: boolean;
}

export default function AutomationManagement() {
  const { user, isLoading: storeLoading } = useUserStore();
  
  // Log do estado inicial
  useEffect(() => {
    console.log('🎬 Componente AutomationManagement montado');
    console.log('👤 Usuário:', user ? 'Autenticado' : 'Não autenticado');
    console.log('🔄 Store loading:', storeLoading);
    
    return () => {
      console.log('🎬 Componente AutomationManagement desmontado');
    };
  }, [user, storeLoading]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  
  // Estados para modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_name: 'conversation_created' as 'conversation_created' | 'message_created' | 'conversation_assigned' | 'conversation_resolved',
    conditions: [] as Array<{
      attribute_key: string;
      filter_operator: string;
      query_operator?: string;
      values: any[];
    }>,
    actions: [] as Array<{
      action_name: string;
      action_params: any[];
    }>,
    active: true
  });

  // Estados para gerenciar múltiplas condições e ações
  const [newCondition, setNewCondition] = useState({
    attribute_key: 'content',
    filter_operator: 'contains',
    query_operator: 'OR',
    values: [] as string[]
  });

  const [newAction, setNewAction] = useState({
    action_name: 'add_label',
    action_params: [] as any[]
  });

  // Estados específicos para ações
  const [actionParams, setActionParams] = useState({
    assignToTeam: '',
    assignToAgent: '',
    setPriority: 'medium',
    addLabel: '',
    sendMessage: ''
  });

  // Estado para parâmetros de condições
  const [conditionParams, setConditionParams] = useState({
    inboxIds: [] as number[]
  });

  // Estado para controlar abas do modal
  const [activeTab, setActiveTab] = useState<'conditions' | 'actions'>('conditions');

  useEffect(() => {
    if (user?.auth_token) {
      fetchData();
    }
  }, [user?.auth_token]);

    const fetchData = async () => {
      if (!user?.auth_token) return;
      
      try {
        setLoading(true);
      setError(null);

      // Buscar times e agentes
      const [teamsData, agentsData] = await Promise.all([
        getTeams(user.auth_token),
        getAgents(user.auth_token)
      ]);

      setTeams(teamsData.payload || []);
      setAgents(agentsData.payload || []);

      // Buscar automações
      try {
        const automationsData = await getAutomations(user.auth_token);
        const automationsList = automationsData.payload || [];
        setAutomationRules(automationsList);
      } catch (automationError) {
        console.error('Erro ao buscar automações:', automationError);
        setAutomationRules([]);
      }

    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      setError(error.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

  // Monitorar mudanças no estado das automações
  useEffect(() => {
    console.log('📊 Estado atual das automações:', {
      count: automationRules.length,
      loading,
      error,
      rules: automationRules.map(r => ({ id: r.id, name: r.name, active: r.active }))
    });
  }, [automationRules, loading, error]);

  // Monitorar mudanças no loading
  useEffect(() => {
    console.log('🔄 Estado do loading mudou:', loading);
  }, [loading]);

  // Monitorar mudanças nos dados de teams e agents
  useEffect(() => {
    console.log('👥 Estado atual de teams e agents:', {
      teams: teams.length,
      agents: agents.length,
      teamsData: teams,
      agentsData: agents
    });
    
    // Log detalhado quando os dados mudam
    if (teams.length > 0) {
      console.log('✅ Teams carregados:', teams.map((t: Team) => ({ id: t.id, name: t.name })));
    }
    if (agents.length > 0) {
      console.log('✅ Agents carregados:', agents.map((a: Agent) => ({ id: a.id, name: a.name })));
    }
  }, [teams, agents]);

  // Log de renderização
  console.log('🎨 Componente renderizando:', {
    user: !!user,
    storeLoading,
    loading,
    automationRulesCount: automationRules.length,
    teamsCount: teams.length,
    agentsCount: agents.length,
    error
  });

  // Log específico para teams e agents
  if (teams.length > 0 || agents.length > 0) {
    console.log('✅ Teams e Agents carregados:', {
      teams: teams.map(t => ({ id: t.id, name: t.name })),
      agents: agents.map(a => ({ id: a.id, name: a.name }))
    });
  } else {
    console.log('⚠️ Teams e Agents ainda não carregados ou vazios:', {
      teamsLength: teams.length,
      agentsLength: agents.length,
      teams: teams,
      agents: agents
    });
  }

  // Função utilitária para processar resposta da API
  const processAutomationsResponse = (automationsData: any) => {
    console.log('🔍 Processando resposta de automações:', automationsData);
    
    let automationsList = [];
    if (Array.isArray(automationsData)) {
      automationsList = automationsData;
    } else if (automationsData && typeof automationsData === 'object') {
      if (automationsData.payload && Array.isArray(automationsData.payload)) {
        automationsList = automationsData.payload;
      } else if (automationsData.data && Array.isArray(automationsData.data)) {
        automationsList = automationsData.data;
      } else if (automationsData.automation_rules && Array.isArray(automationsData.automation_rules)) {
        automationsList = automationsData.automation_rules;
      } else {
        automationsList = Object.values(automationsData).find(val => Array.isArray(val)) || [];
      }
    }
    
    console.log('📋 Lista final de automações:', automationsList);
    return automationsList;
  };

  const handleCreateRule = async () => {
    if (!user?.auth_token) return;
    
    // Validação do nome da regra
    if (!formData.name || formData.name.trim() === '') {
      setError('O nome da regra é obrigatório');
      return;
    }
    
    console.log('🔄 Criando nova regra de automação...');
    console.log('📝 Dados do formulário:', formData);
    
    try {
      // Preparar dados no formato correto da API
      const automationData = {
        name: formData.name.trim(),
      description: formData.description || '',
        event_name: formData.event_name,
        active: formData.active,
        actions: formData.actions,
        conditions: formData.conditions
      };

      console.log('📤 Dados formatados para API:', automationData);
      
      const newRule = await createAutomation(user.auth_token, automationData);
      
      console.log('✅ Nova regra criada:', newRule);
      
      // Recarregar lista de automações
      const automationsData = await getAutomations(user.auth_token);
      const automationsList = processAutomationsResponse(automationsData);
      setAutomationRules(automationsList);
      
    setShowCreateModal(false);
    resetForm();
      setError(null); // Limpar erro anterior
    } catch (err) {
      console.error('❌ Erro ao criar automação:', err);
      setError('Erro ao criar automação. Verifique o console para mais detalhes.');
    }
  };

  const handleEditRule = async () => {
    if (!editingRule || !user?.auth_token) return;
    
    // Validação do nome da regra
    if (!formData.name || formData.name.trim() === '') {
      setError('O nome da regra é obrigatório');
      return;
    }
    
    console.log('🔄 Editando regra de automação:', editingRule.id);
    
    try {
      // Preparar dados no formato correto da API
      const automationData = {
        name: formData.name.trim(),
        description: formData.description,
        event_name: formData.event_name,
        active: formData.active,
        actions: formData.actions,
        conditions: formData.conditions
      };

      console.log('📤 Dados formatados para API:', automationData);
      
      await updateAutomation(user.auth_token, editingRule.id, automationData);
      
      // Recarregar lista de automações
      const automationsData = await getAutomations(user.auth_token);
      const automationsList = processAutomationsResponse(automationsData);
      setAutomationRules(automationsList);
      
    setShowEditModal(false);
    setEditingRule(null);
    resetForm();
      setError(null); // Limpar erro anterior
    } catch (err) {
      console.error('❌ Erro ao atualizar automação:', err);
      setError('Erro ao atualizar automação. Verifique o console para mais detalhes.');
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!user?.auth_token) return;
    
    if (confirm('Tem certeza que deseja excluir esta regra de automação?')) {
      console.log('🔄 Deletando regra de automação:', ruleId);
      
      try {
        await deleteAutomation(user.auth_token, ruleId);
        
        // Recarregar lista de automações
        const automationsData = await getAutomations(user.auth_token);
        const automationsList = processAutomationsResponse(automationsData);
        setAutomationRules(automationsList);
      } catch (err) {
        console.error('❌ Erro ao deletar automação:', err);
        setError('Erro ao deletar automação. Verifique o console para mais detalhes.');
      }
    }
  };

  const handleToggleRule = async (ruleId: number) => {
    if (!user?.auth_token) return;
    
    const rule = automationRules.find(r => r.id === ruleId);
    if (!rule) return;
    
    console.log('🔄 Alternando status da regra:', ruleId, 'de', rule.active, 'para', !rule.active);
    
    try {
      await updateAutomation(user.auth_token, ruleId, {
        active: !rule.active
      });
      
      // Recarregar lista de automações
      const automationsData = await getAutomations(user.auth_token);
      const automationsList = processAutomationsResponse(automationsData);
      setAutomationRules(automationsList);
    } catch (err) {
      console.error('❌ Erro ao alternar automação:', err);
      setError('Erro ao alternar automação. Verifique o console para mais detalhes.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      event_name: 'conversation_created',
      conditions: [],
      actions: [],
      active: true
    });
    setNewCondition({
      attribute_key: 'content',
      filter_operator: 'contains',
      query_operator: 'OR',
      values: []
    });
    setNewAction({
      action_name: 'add_label',
      action_params: []
    });
    setActionParams({
      assignToTeam: '',
      assignToAgent: '',
      setPriority: 'medium',
      addLabel: '',
      sendMessage: ''
    });
    setConditionParams({
      inboxIds: []
    });
  };

  const openEditModal = (rule: AutomationRule) => {
    console.log('🔄 Abrindo modal de edição para regra:', rule);
    
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      event_name: rule.event_name as 'conversation_created' | 'message_created' | 'conversation_assigned' | 'conversation_resolved',
      conditions: rule.conditions,
      actions: rule.actions,
      active: rule.active
    });
    setShowEditModal(true);

    // Initialize actionParams based on existing actions
    const initialActionParams = {
      assignToTeam: '',
      assignToAgent: '',
      setPriority: 'medium',
      addLabel: '',
      sendMessage: ''
    };

    // Find the first action of each type to pre-populate the form
    console.log('🔍 Processando ações da regra para inicializar actionParams:', rule.actions);
    
    rule.actions.forEach(action => {
      console.log('🔍 Processando ação:', action);
      switch (action.action_name) {
        case 'assign_team':
          if (action.action_params[0]) {
            initialActionParams.assignToTeam = action.action_params[0].toString();
            console.log('✅ Definindo assignToTeam:', action.action_params[0].toString());
          }
          break;
        case 'assign_agent':
          if (action.action_params[0]) {
            initialActionParams.assignToAgent = action.action_params[0].toString();
            console.log('✅ Definindo assignToAgent:', action.action_params[0].toString());
          }
          break;
        case 'set_priority':
          if (action.action_params[0]) {
            initialActionParams.setPriority = action.action_params[0];
            console.log('✅ Definindo setPriority:', action.action_params[0]);
          }
          break;
        case 'add_label':
          if (action.action_params[0]) {
            initialActionParams.addLabel = action.action_params[0];
            console.log('✅ Definindo addLabel:', action.action_params[0]);
          }
          break;
        case 'send_message':
          if (action.action_params[0]) {
            initialActionParams.sendMessage = action.action_params[0];
            console.log('✅ Definindo sendMessage:', action.action_params[0]);
          }
          break;
      }
    });

    console.log('🔧 ActionParams inicializados:', initialActionParams);

    // Initialize conditionParams based on existing conditions
    const initialConditionParams = {
      inboxIds: [] as number[]
    };

    // Find inbox_id conditions to pre-populate the form
    console.log('🔍 Processando condições da regra para inicializar conditionParams:', rule.conditions);
    
    rule.conditions.forEach(condition => {
      console.log('🔍 Processando condição:', condition);
      if (condition.attribute_key === 'inbox_id' && condition.values.length > 0) {
        // Convert string values to numbers for inboxIds
        const inboxIds = condition.values.map((value: any) => parseInt(value)).filter(id => !isNaN(id));
        initialConditionParams.inboxIds = inboxIds;
        console.log('✅ Definindo inboxIds:', inboxIds);
      }
    });

    console.log('🔧 ConditionParams inicializados:', initialConditionParams);

    setActionParams(initialActionParams);
    setConditionParams(initialConditionParams);
  };

  // Funções para gerenciar condições e ações
  const addCondition = () => {
    let conditionValues = newCondition.values;
    
    // Se for condição de inbox, usar os valores selecionados
    if (newCondition.attribute_key === 'inbox_id' && conditionParams.inboxIds.length > 0) {
      conditionValues = conditionParams.inboxIds.map(id => id.toString());
    }
    
    if (conditionValues.length > 0) {
      setFormData({
        ...formData,
        conditions: [...formData.conditions, { ...newCondition, values: conditionValues }]
      });
      setNewCondition({
        attribute_key: 'content',
        filter_operator: 'contains',
        query_operator: 'OR',
        values: []
      });
      setConditionParams({
        inboxIds: []
      });
    }
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    });
  };

  const addAction = () => {
    let params: any[] = [];
    
    // Preparar parâmetros baseados no tipo de ação
    switch (newAction.action_name) {
      case 'assign_team':
        if (actionParams.assignToTeam) {
          params = [parseInt(actionParams.assignToTeam)];
        }
        break;
      case 'assign_agent':
        if (actionParams.assignToAgent) {
          params = [parseInt(actionParams.assignToAgent)];
        }
        break;
      case 'set_priority':
        if (actionParams.setPriority && actionParams.setPriority !== 'medium') {
          params = [actionParams.setPriority];
        }
        break;
      case 'add_label':
        if (actionParams.addLabel) {
          params = [actionParams.addLabel];
        }
        break;
      case 'send_message':
        if (actionParams.sendMessage) {
          params = [actionParams.sendMessage];
        }
        break;
      default:
        params = newAction.action_params;
    }
    
    if (params.length > 0) {
      setFormData({
        ...formData,
        actions: [...formData.actions, { 
          action_name: newAction.action_name, 
          action_params: params 
        }]
      });
      
      // Resetar parâmetros específicos
      setActionParams({
        assignToTeam: '',
        assignToAgent: '',
        setPriority: 'medium',
        addLabel: '',
        sendMessage: ''
      });
      
      setNewAction({
        action_name: 'add_label',
        action_params: []
      });
    }
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (storeLoading) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Carregando...</h3>
        <p className="text-gray-500">Verificando autenticação</p>
      </div>
    );
  }

  if (!user) {
  return (
      <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Acesso Restrito</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Você precisa estar logado para acessar esta página.
        </p>
          <button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
          Ir para Login
          </button>
        </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Carregando...</h3>
        <p className="text-gray-500 dark:text-gray-400">Buscando dados de automação</p>
              </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-red-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Erro ao carregar dados</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Tentar Novamente
        </button>
                </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Automação de Alocação de Conversas</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure regras de automação baseadas em gatilhos e ações para otimizar a distribuição de conversas
          </p>
              </div>

        {/* Alert de erro */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error}
            </div>
        )}



        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total de Regras</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{automationRules.length}</p>
              </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Regras Ativas</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {automationRules.filter(r => r.active).length}
            </p>
                </div>
              </div>

        {/* Botão Criar Nova Regra */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Criar Nova Regra de Automação
          </button>
            </div>

        {/* Lista de Regras */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Regras de Automação</h2>
          </div>

          {automationRules.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma regra de automação</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Comece criando sua primeira regra de automação para otimizar a alocação de conversas.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Criar Primeira Regra
              </button>
              </div>
          ) : (
        <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Regra
                </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Gatilho
                </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estatísticas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {automationRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{rule.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{rule.description}</div>
                        </div>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div>Evento: {rule.event_name}</div>
                          <div>Condições: {rule.conditions.length}</div>
                          {rule.conditions.map((condition, index) => (
                            <div key={index} className="text-xs text-gray-500 dark:text-gray-400">
                              {condition.attribute_key}: {condition.values.join(', ')}
                            </div>
                          ))}
                        </div>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div>Ações: {rule.actions.length}</div>
                          {rule.actions.map((action, index) => (
                            <div key={index} className="text-xs text-gray-500 dark:text-gray-400">
                              {action.action_name}: {action.action_params.join(', ')}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div>Criada: {formatDate(new Date(rule.created_on * 1000).toISOString())}</div>
                          <div>Execuções: 0</div>
                    </div>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          rule.active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {rule.active ? 'Ativa' : 'Inativa'}
                        </span>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              rule.active
                                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                            }`}
                          >
                            {rule.active ? 'Desativar' : 'Ativar'}
                    </button>
                      <button
                        onClick={() => openEditModal(rule)}
                            className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 px-3 py-1 rounded text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                            className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 px-3 py-1 rounded text-xs font-medium"
                      >
                        Excluir
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

      {/* Modal Criar Regra */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Criar Nova Regra de Automação</h3>
              
              {/* Informações básicas */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome da Regra <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      formData.name.trim() === '' ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Ex: Atribuir conversas urgentes"
                  />
                  {formData.name.trim() === '' && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">O nome da regra é obrigatório</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    rows={3}
                    placeholder="Descreva o propósito desta regra"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gatilho (Quando)</label>
                  <select
                    value={formData.event_name}
                    onChange={(e) => setFormData({
                      ...formData, 
                      event_name: e.target.value as 'conversation_created' | 'message_created' | 'conversation_assigned' | 'conversation_resolved'
                    })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  >
                    <option value="conversation_created">Conversa é criada</option>
                    <option value="message_created">Mensagem é criada</option>
                    <option value="conversation_assigned">Conversa é atribuída</option>
                    <option value="conversation_resolved">Conversa é resolvida</option>
                  </select>
                </div>
              </div>

              {/* Abas */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
              <button
                    onClick={() => setActiveTab('conditions')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'conditions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Condições
                  </button>
                  <button
                    onClick={() => setActiveTab('actions')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'actions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Ações
                  </button>
                </nav>
              </div>

              {/* Conteúdo das abas */}
              {activeTab === 'conditions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">Condições da Regra</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formData.conditions.length} condição(ões)</span>
                  </div>
                  
                  {/* Lista de condições existentes */}
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {condition.attribute_key === 'content' ? 'Conteúdo da mensagem' : 
                             condition.attribute_key === 'inbox_id' ? 'Inbox' :
                             condition.attribute_key}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {condition.filter_operator === 'contains' ? 'contém' : 
                             condition.filter_operator === 'equal_to' ? 'igual a' :
                             condition.filter_operator}: {
                               condition.attribute_key === 'inbox_id' && condition.values.length > 0 ? (
                                 <div className="mt-1">
                                   {condition.values.map((value: any, idx: number) => {
                                     const inbox = inboxes.find(i => i.id === parseInt(value));
                                     return (
                                       <div key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block mr-1 mb-1">
                                         {inbox ? inbox.name : `Inbox ID: ${value}`}
                                       </div>
                                     );
                                   })}
                                 </div>
                               ) : (
                                 condition.values.join(', ')
                               )
                             }
                          </div>
                        </div>
                        <button
                          onClick={() => removeCondition(index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
                    </div>
                  ))}

                  {/* Adicionar nova condição */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="text-sm font-medium text-blue-900 mb-3">Adicionar Nova Condição</h5>
                    <div className="space-y-3">
                <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Condição</label>
                        <select
                          value={newCondition.attribute_key}
                          onChange={(e) => setNewCondition({...newCondition, attribute_key: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        >
                          <option value="content">Conteúdo da mensagem</option>
                          <option value="inbox_id">Inbox</option>
                          <option value="status">Status da conversa</option>
                          <option value="priority">Prioridade</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Operador</label>
                        <select
                          value={newCondition.filter_operator}
                          onChange={(e) => setNewCondition({...newCondition, filter_operator: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        >
                          <option value="contains">contém</option>
                          <option value="equal_to">igual a</option>
                          <option value="not_equal_to">diferente de</option>
                          <option value="starts_with">começa com</option>
                        </select>
                      </div>

                      {/* Valores - condicional baseado no tipo de condição */}
                      {newCondition.attribute_key === 'inbox_id' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecionar Inboxes</label>
                          <div className="mt-1 border border-gray-300 dark:border-gray-600 rounded-md p-2 max-h-40 overflow-y-auto">
                            {inboxes.map((inbox) => (
                              <label key={inbox.id} className="flex items-center space-x-2 py-1">
                                <input
                                  type="checkbox"
                                  checked={conditionParams.inboxIds.includes(inbox.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setConditionParams({
                                        ...conditionParams,
                                        inboxIds: [...conditionParams.inboxIds, inbox.id]
                                      });
                                    } else {
                                      setConditionParams({
                                        ...conditionParams,
                                        inboxIds: conditionParams.inboxIds.filter(id => id !== inbox.id)
                                      });
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{inbox.name}</span>
                  </label>
                            ))}
                          </div>
                          {conditionParams.inboxIds.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                              Selecionados: {conditionParams.inboxIds.length} inbox(es)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valores</label>
                  <input
                    type="text"
                            value={newCondition.values.join(', ')}
                            onChange={(e) => setNewCondition({
                              ...newCondition,
                              values: e.target.value.split(',').map(v => v.trim()).filter(v => v.length > 0)
                            })}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="Ex: urgente, help, suporte (separados por vírgula)"
                  />
                </div>
                      )}

                      <button
                        onClick={addCondition}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Adicionar Condição
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">Ações da Regra</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formData.actions.length} ação(ões)</span>
                  </div>
                  
                  {/* Lista de ações existentes */}
                  {formData.actions.map((action, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {action.action_name === 'add_label' ? 'Adicionar Label' :
                             action.action_name === 'assign_team' ? 'Atribuir para Time' :
                             action.action_name === 'assign_agent' ? 'Atribuir para Agente' :
                             action.action_name === 'set_priority' ? 'Definir Prioridade' :
                             action.action_name === 'send_message' ? 'Enviar Mensagem' :
                             action.action_name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {action.action_name === 'assign_team' && action.action_params[0] ? 
                              teams.find(t => t.id === action.action_params[0])?.name || `Time ID: ${action.action_params[0]}` :
                             action.action_name === 'assign_agent' && action.action_params[0] ? 
                              agents.find(a => a.id === action.action_params[0])?.name || `Agente ID: ${action.action_params[0]}` :
                             action.action_params.join(', ')}
                          </div>
                        </div>
                        <button
                          onClick={() => removeAction(index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Adicionar nova ação */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h5 className="text-sm font-medium text-green-900 mb-3">Adicionar Nova Ação</h5>
                    <div className="space-y-3">
                <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Ação</label>
                        <select
                          value={newAction.action_name}
                          onChange={(e) => setNewAction({...newAction, action_name: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        >
                          <option value="add_label">Adicionar Label</option>
                          <option value="assign_team">Atribuir para Time</option>
                          <option value="assign_agent">Atribuir para Agente</option>
                          <option value="set_priority">Definir Prioridade</option>
                          <option value="send_message">Enviar Mensagem</option>
                        </select>
                      </div>

                      {/* Parâmetros específicos baseados no tipo de ação */}
                      {newAction.action_name === 'assign_team' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecionar Time</label>
                          <select
                            value={actionParams.assignToTeam}
                            onChange={(e) => setActionParams({...actionParams, assignToTeam: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          >
                            <option value="">Selecione um time</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {newAction.action_name === 'assign_agent' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecionar Agente</label>
                          <select
                            value={actionParams.assignToAgent}
                            onChange={(e) => setActionParams({...actionParams, assignToAgent: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          >
                            <option value="">Selecione um agente</option>
                            {agents.map((agent) => (
                              <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {newAction.action_name === 'set_priority' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Definir Prioridade</label>
                          <select
                            value={actionParams.setPriority}
                            onChange={(e) => setActionParams({...actionParams, setPriority: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          >
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="urgent">Urgente</option>
                          </select>
                        </div>
                      )}

                      {newAction.action_name === 'add_label' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Label</label>
                  <input
                            type="text"
                            value={actionParams.addLabel}
                            onChange={(e) => setActionParams({...actionParams, addLabel: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="Ex: urgente, suporte, vip"
                  />
                </div>
                      )}

                      {newAction.action_name === 'send_message' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem</label>
                          <textarea
                            value={actionParams.sendMessage}
                            onChange={(e) => setActionParams({...actionParams, sendMessage: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            rows={3}
                            placeholder="Digite a mensagem que será enviada automaticamente"
                          />
              </div>
                      )}

                      <button
                        onClick={addAction}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        Adicionar Ação
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900 dark:text-white">Regra ativa</label>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateRule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Criar Regra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Regra */}
      {showEditModal && editingRule && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Editar Regra de Automação</h3>
              
              {/* Informações básicas */}
              <div className="space-y-4 mb-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome da Regra <span className="text-red-500">*</span>
                </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      formData.name.trim() === '' ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Ex: Atribuir conversas urgentes"
                  />
                  {formData.name.trim() === '' && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">O nome da regra é obrigatório</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <textarea
                    value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  rows={3}
                    placeholder="Descreva o propósito desta regra"
                />
              </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gatilho (Quando)</label>
                    <select
                    value={formData.event_name}
                      onChange={(e) => setFormData({
                        ...formData, 
                      event_name: e.target.value as 'conversation_created' | 'message_created' | 'conversation_assigned' | 'conversation_resolved'
                    })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  >
                    <option value="conversation_created">Conversa é criada</option>
                    <option value="message_created">Mensagem é criada</option>
                    <option value="conversation_assigned">Conversa é atribuída</option>
                    <option value="conversation_resolved">Conversa é resolvida</option>
                    </select>
                </div>
                  </div>

              {/* Abas */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('conditions')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'conditions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Condições
                  </button>
                  <button
                    onClick={() => setActiveTab('actions')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'actions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Ações
                  </button>
                </nav>
              </div>

              {/* Conteúdo das abas */}
              {activeTab === 'conditions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">Condições da Regra</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formData.conditions.length} condição(ões)</span>
                  </div>
                  
                  {/* Lista de condições existentes */}
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {condition.attribute_key === 'content' ? 'Conteúdo da mensagem' : 
                             condition.attribute_key === 'inbox_id' ? 'Inbox' :
                             condition.attribute_key}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {condition.filter_operator === 'contains' ? 'contém' : 
                             condition.filter_operator === 'equal_to' ? 'igual a' :
                             condition.filter_operator}: {
                               condition.attribute_key === 'inbox_id' && condition.values.length > 0 ? (
                                 <div className="mt-1">
                                   {condition.values.map((value: any, idx: number) => {
                                     const inbox = inboxes.find(i => i.id === parseInt(value));
                                     return (
                                       <div key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block mr-1 mb-1">
                                         {inbox ? inbox.name : `Inbox ID: ${value}`}
                                       </div>
                                     );
                                   })}
                                 </div>
                               ) : (
                                 condition.values.join(', ')
                               )
                             }
                          </div>
                        </div>
                        <button
                          onClick={() => removeCondition(index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Adicionar nova condição */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="text-sm font-medium text-blue-900 mb-3">Adicionar Nova Condição</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Condição</label>
                        <select
                          value={newCondition.attribute_key}
                          onChange={(e) => setNewCondition({...newCondition, attribute_key: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        >
                          <option value="content">Conteúdo da mensagem</option>
                          <option value="inbox_id">Inbox</option>
                          <option value="status">Status da conversa</option>
                          <option value="priority">Prioridade</option>
                    </select>
                  </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Operador</label>
                        <select
                          value={newCondition.filter_operator}
                          onChange={(e) => setNewCondition({...newCondition, filter_operator: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        >
                          <option value="contains">contém</option>
                          <option value="equal_to">igual a</option>
                          <option value="not_equal_to">diferente de</option>
                          <option value="starts_with">começa com</option>
                        </select>
                </div>

                      {/* Valores - condicional baseado no tipo de condição */}
                      {newCondition.attribute_key === 'inbox_id' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecionar Inboxes</label>
                          <div className="mt-1 border border-gray-300 dark:border-gray-600 rounded-md p-2 max-h-40 overflow-y-auto">
                            {inboxes.map((inbox) => (
                              <label key={inbox.id} className="flex items-center space-x-2 py-1">
                                <input
                                  type="checkbox"
                                  checked={conditionParams.inboxIds.includes(inbox.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setConditionParams({
                                        ...conditionParams,
                                        inboxIds: [...conditionParams.inboxIds, inbox.id]
                                      });
                                    } else {
                                      setConditionParams({
                                        ...conditionParams,
                                        inboxIds: conditionParams.inboxIds.filter(id => id !== inbox.id)
                                      });
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{inbox.name}</span>
                  </label>
                            ))}
                          </div>
                          {conditionParams.inboxIds.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                              Selecionados: {conditionParams.inboxIds.length} inbox(es)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valores</label>
                  <input
                    type="text"
                            value={newCondition.values.join(', ')}
                            onChange={(e) => setNewCondition({
                              ...newCondition,
                              values: e.target.value.split(',').map(v => v.trim()).filter(v => v.length > 0)
                            })}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="Ex: urgente, help, suporte (separados por vírgula)"
                  />
                </div>
                      )}

                      <button
                        onClick={addCondition}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Adicionar Condição
                      </button>
              </div>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">Ações da Regra</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formData.actions.length} ação(ões)</span>
                  </div>
                  
                  {/* Lista de ações existentes */}
                  {formData.actions.map((action, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {action.action_name === 'add_label' ? 'Adicionar Label' :
                             action.action_name === 'assign_team' ? 'Atribuir para Time' :
                             action.action_name === 'assign_agent' ? 'Atribuir para Agente' :
                             action.action_name === 'set_priority' ? 'Definir Prioridade' :
                             action.action_name === 'send_message' ? 'Enviar Mensagem' :
                             action.action_name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {action.action_name === 'assign_team' && action.action_params[0] ? 
                              teams.find(t => t.id === action.action_params[0])?.name || `Time ID: ${action.action_params[0]}` :
                             action.action_name === 'assign_agent' && action.action_params[0] ? 
                              agents.find(a => a.id === action.action_params[0])?.name || `Agente ID: ${action.action_params[0]}` :
                             action.action_params.join(', ')}
                          </div>
                        </div>
                        <button
                          onClick={() => removeAction(index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Adicionar nova ação */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h5 className="text-sm font-medium text-green-900 mb-3">Adicionar Nova Ação</h5>
                    <div className="space-y-3">
                  <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Ação</label>
                    <select
                          value={newAction.action_name}
                          onChange={(e) => setNewAction({...newAction, action_name: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        >
                          <option value="add_label">Adicionar Label</option>
                          <option value="assign_team">Atribuir para Time</option>
                          <option value="assign_agent">Atribuir para Agente</option>
                          <option value="set_priority">Definir Prioridade</option>
                          <option value="send_message">Enviar Mensagem</option>
                        </select>
                      </div>

                      {/* Parâmetros específicos baseados no tipo de ação */}
                      {newAction.action_name === 'assign_team' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecionar Time</label>
                          <select
                            value={actionParams.assignToTeam}
                            onChange={(e) => setActionParams({...actionParams, assignToTeam: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          >
                            <option value="">Selecione um time</option>
                      {teams.map((team) => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                      )}

                      {newAction.action_name === 'assign_agent' && (
                  <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecionar Agente</label>
                    <select
                            value={actionParams.assignToAgent}
                            onChange={(e) => setActionParams({...actionParams, assignToAgent: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          >
                            <option value="">Selecione um agente</option>
                      {agents.map((agent) => (
                              <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                  </div>
                      )}

                      {newAction.action_name === 'set_priority' && (
                  <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Definir Prioridade</label>
                    <select
                            value={actionParams.setPriority}
                            onChange={(e) => setActionParams({...actionParams, setPriority: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                      )}

                      {newAction.action_name === 'add_label' && (
                  <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Label</label>
                    <input
                      type="text"
                            value={actionParams.addLabel}
                            onChange={(e) => setActionParams({...actionParams, addLabel: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="Ex: urgente, suporte, vip"
                    />
                  </div>
                      )}

                      {newAction.action_name === 'send_message' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem</label>
                          <textarea
                            value={actionParams.sendMessage}
                            onChange={(e) => setActionParams({...actionParams, sendMessage: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            rows={3}
                            placeholder="Digite a mensagem que será enviada automaticamente"
                          />
                </div>
                      )}

                      <button
                        onClick={addAction}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        Adicionar Ação
                      </button>
              </div>
                  </div>
                </div>
              )}

              <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900 dark:text-white">Regra ativa</label>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRule(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditRule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 