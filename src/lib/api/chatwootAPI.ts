import axios from 'axios';

// URL usando API route do Next.js
const API_BASE_URL = '/api/chatwoot';
const ACCOUNT_ID = '1';

// Cliente base sem token
const createBaseClient = () => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    timeout: 10000, // 10 segundos de timeout
  });
};

// Cliente autenticado - usando o token correto da API
const createAuthenticatedClient = (token: string) => {
  return axios.create({
    baseURL: `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}`,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'api_access_token': token,
    },
  });
};

// Interface para resposta real da API
interface LoginResponse {
  access_token: string;
  account_id: number;
  available_name: string;
  avatar_url: string;
  confirmed: boolean;
  display_name: string | null;
  message_signature: string | null;
  email: string;
  id: number;
  inviter_id: number | null;
  name: string;
  provider: string;
  pubsub_token: string;
  role: 'administrator' | 'agent';
  ui_settings: any;
  uid: string;
  type: string;
  accounts: Array<{
    id: number;
    name: string;
    status: string;
    active_at: string;
    role: string;
    permissions: string[];
    availability: string;
    availability_status: string;
    auto_offline: boolean;
  }>;
}

// Interface para usuário
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'administrator' | 'agent';
  account_id: number;
  auth_token: string;
}

// Testar conectividade da API
export const testAPI = async () => {
  try {
    console.log('Testando conectividade com a API...');
    const client = createBaseClient();
    const response = await client.post('/auth/sign_in');
    console.log('API está acessível:', response.data);
    return { success: true, url: API_BASE_URL };
  } catch (error: any) {
    console.error('Erro ao conectar com a API:', error.response?.data || error.message);
    return { success: false, url: null };
  }
};

// Login - usando o endpoint correto
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    console.log('Tentando login com:', { email, password: '***' });
    
    const client = createBaseClient();
    const response = await client.post('/auth/sign_in', {
      email,
      password,
    });
    
    console.log('Resposta completa do login:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    
    // A resposta tem estrutura aninhada: response.data.data
    const responseData = response.data.data || response.data;
    
    // Verificar se a resposta tem a estrutura esperada
    if (!responseData.access_token || !responseData.email) {
      console.error('Resposta não tem estrutura esperada:', responseData);
      throw new Error('Resposta da API não tem formato esperado');
    }
    
    const data: LoginResponse = responseData;
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      account_id: data.account_id,
      auth_token: data.access_token, // Usar access_token como auth_token
    };
  } catch (error: any) {
    console.error('Erro detalhado no login:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    // Se for erro de credenciais, mostrar mensagem mais específica
    if (error.response?.status === 401) {
      throw new Error('Email ou senha incorretos');
    } else if (error.response?.status === 422) {
      throw new Error('Dados de login inválidos');
    } else {
      throw new Error(`Erro no login: ${error.response?.data?.message || error.message}`);
    }
  }
};

// Buscar conversas (para agents) - endpoint correto da API
export const getConversations = async (token: string) => {
  try {
    console.log('Buscando conversas com token:', token.substring(0, 10) + '...');
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get('/conversations');
    console.log('Resposta das conversas:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    throw error;
  }
};

// Buscar agentes (para admin) - endpoint correto da API
export const getAgents = async (token: string) => {
  try {
    console.log('🔄 Iniciando busca de agentes...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/agents`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get('/agents');
    
    console.log('✅ Resposta dos agentes recebida:', response.data);
    console.log('📊 Total de agentes:', Array.isArray(response.data) ? response.data.length : 'N/A');
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar agentes:', error);
    throw error;
  }
};

// Buscar estatísticas da conta (para admin) - endpoint correto da API
export const getAccountStats = async (token: string) => {
  try {
    console.log('🔄 Iniciando busca de estatísticas...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/account`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get('/account');
    
    console.log('✅ Resposta das estatísticas recebida:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    throw error;
  }
};

// Buscar conversas específicas (para agents) - endpoint correto da API
export const getConversation = async (token: string, conversationId: number) => {
  try {
    console.log('🔄 Iniciando busca de conversa específica...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get(`/conversations/${conversationId}`);
    
    console.log('✅ Resposta da conversa recebida:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar conversa:', error);
    throw error;
  }
};

// Buscar inboxes da conta (para admin)
export const getInboxes = async (token: string) => {
  try {
    console.log('🔄 Iniciando busca de inboxes...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/inboxes`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get('/inboxes');
    
    console.log('✅ Resposta dos inboxes recebida:', response.data);
    console.log('📊 Total de inboxes:', response.data.payload ? response.data.payload.length : 'N/A');
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar inboxes:', error);
    throw error;
  }
};

// Buscar conversas por inbox (para estatísticas)
export const getConversationsByInbox = async (token: string, inboxId: number) => {
  try {
    console.log('🔄 Iniciando busca de conversas do inbox:', inboxId);
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/inboxes/${inboxId}/conversations`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get(`/inboxes/${inboxId}/conversations`);
    
    console.log('✅ Resposta das conversas do inbox recebida:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar conversas do inbox:', error);
    throw error;
  }
};

// Buscar estatísticas gerais de conversas
export const getConversationStats = async (token: string) => {
  try {
    console.log('🔄 Iniciando busca de estatísticas de conversas...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get('/conversations');
    
    console.log('✅ Resposta das estatísticas de conversas recebida:', response.data);
    console.log('🔍 Debug - Tipo da resposta:', typeof response.data);
    console.log('🔍 Debug - É array?', Array.isArray(response.data));
    console.log('🔍 Debug - Estrutura completa:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de conversas:', error);
    throw error;
  }
};



// Criar novo inbox
export const createInbox = async (token: string, inboxData: {
  name: string;
  channel_type: string;
}) => {
  try {
    console.log('🔄 Criando novo inbox...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/inboxes`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Dados do inbox:', inboxData);
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.post('/inboxes', inboxData);
    
    console.log('✅ Inbox criado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar inbox:', error);
    throw error;
  }
};

// Atualizar inbox existente
export const updateInbox = async (token: string, inboxId: number, inboxData: {
  name: string;
  channel_type: string;
}) => {
  try {
    console.log('🔄 Atualizando inbox...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/inboxes/${inboxId}`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Dados do inbox:', inboxData);
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.put(`/inboxes/${inboxId}`, inboxData);
    
    console.log('✅ Inbox atualizado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar inbox:', error);
    throw error;
  }
};

// Deletar inbox
export const deleteInbox = async (token: string, inboxId: number) => {
  try {
    console.log('🔄 Deletando inbox...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/inboxes/${inboxId}`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.delete(`/inboxes/${inboxId}`);
    
    console.log('✅ Inbox deletado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao deletar inbox:', error);
    throw error;
  }
};

// Criar novo agente
export const createAgent = async (token: string, agentData: {
  name: string;
  email: string;
  role: string;
  password: string;
}) => {
  try {
    console.log('🔄 Criando novo agente...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/agents`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Dados do agente:', { ...agentData, password: '***' });
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.post('/agents', agentData);
    
    console.log('✅ Agente criado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar agente:', error);
    throw error;
  }
};

// Atualizar agente existente
export const updateAgent = async (token: string, agentId: number, agentData: {
  name: string;
  email: string;
  role: string;
  password?: string;
}) => {
  try {
    console.log('🔄 Atualizando agente...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/agents/${agentId}`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Dados do agente:', { ...agentData, password: agentData.password ? '***' : undefined });
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.put(`/agents/${agentId}`, agentData);
    
    console.log('✅ Agente atualizado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar agente:', error);
    throw error;
  }
};

// Deletar agente
export const deleteAgent = async (token: string, agentId: number) => {
  try {
    console.log('🔄 Deletando agente...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/agents/${agentId}`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.delete(`/agents/${agentId}`);
    
    console.log('✅ Agente deletado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao deletar agente:', error);
    throw error;
  }
}; 

// Criar novo inbox via N8N workflow
export const createInboxViaN8N = async (token: string, inboxData: {
  name: string;
  channel_type: string;
  platform_type: 'maturation' | 'digital_platform';
}) => {
  try {
    console.log('🔄 Criando inbox via N8N workflow...');
    console.log('📝 Dados do inbox:', inboxData);
    
    // Chamar diretamente o workflow do N8N (endpoint: http://212.85.17.18:5678/webhook/criainbox)
    const n8nResponse = await fetch('/api/n8n/create-whatsapp-instance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inboxName: inboxData.name,
        channelType: inboxData.channel_type,
        platformType: inboxData.platform_type,
        authToken: token // Passar o token para o N8N criar a inbox
      })
    });
    
    console.log('📡 Resposta do N8N:', {
      status: n8nResponse.status,
      statusText: n8nResponse.statusText
    });
    
    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('❌ Erro na resposta do N8N:', errorText);
      throw new Error(`Erro no workflow N8N: ${n8nResponse.status} ${n8nResponse.statusText}`);
    }
    
    const n8nResult = await n8nResponse.json();
    console.log('✅ Workflow N8N executado com sucesso:', n8nResult);
    
    return {
      n8n: n8nResult,
      success: true
    };
  } catch (error) {
    console.error('❌ Erro ao criar inbox via N8N:', error);
    throw error;
  }
};

// Função para buscar instâncias da Evolution API
export const getEvolutionInstances = async (token: string) => {
  try {
    console.log('🔄 Buscando instâncias da Evolution API...');
    
    const response = await fetch('/api/evolution/instances', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': token
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar instâncias: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Instâncias da Evolution API:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar instâncias da Evolution API:', error);
    throw error;
  }
};

// Função para sincronizar inboxes e identificar tipos
export const syncInboxes = async (token: string) => {
  try {
    console.log('🔄 Sincronizando inboxes...');
    
    // Buscar inboxes do Chatwoot
    const chatwootInboxes = await getInboxes(token);
    const chatwootInboxNames = (chatwootInboxes.payload || []).map((inbox: any) => inbox.name);
    
    // Buscar instâncias da Evolution API
    const evolutionInstances = await getEvolutionInstances(token);
    const evolutionInstanceNames = (evolutionInstances.instances || []).map((instance: any) => instance.instance);
    
    console.log('📊 Análise de sincronização:', {
      chatwootInboxes: chatwootInboxNames,
      evolutionInstances: evolutionInstanceNames
    });
    
    // Identificar inboxes de maturação (estão na Evolution mas não no Chatwoot)
    const maturationInboxes = evolutionInstanceNames.filter(
      (name: string) => !chatwootInboxNames.includes(name)
    );
    
    // Identificar inboxes de plataforma digital (estão em ambos)
    const digitalPlatformInboxes = evolutionInstanceNames.filter(
      (name: string) => chatwootInboxNames.includes(name)
    );
    
    console.log('🎯 Resultado da sincronização:', {
      maturationInboxes,
      digitalPlatformInboxes
    });
    
    return {
      maturationInboxes,
      digitalPlatformInboxes,
      chatwootInboxes: chatwootInboxes.payload || [],
      evolutionInstances: evolutionInstances.instances || []
    };
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    throw error;
  }
}; 

// ===== FUNÇÕES PARA TIMES =====

// Buscar times
export const getTeams = async (token: string) => {
  try {
    console.log('🔄 Buscando times...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/teams`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get('/teams');
    
    console.log('✅ Times recebidos:', response.data);
    console.log('📊 Total de times:', Array.isArray(response.data) ? response.data.length : 'N/A');
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar times:', error);
    throw error;
  }
};

// Criar novo time
export const createTeam = async (token: string, teamData: {
  name: string;
  description?: string;
}) => {
  try {
    console.log('🔄 Criando novo time...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/teams`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Dados do time:', teamData);
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.post('/teams', teamData);
    
    console.log('✅ Time criado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar time:', error);
    throw error;
  }
};

// Atualizar time existente
export const updateTeam = async (token: string, teamId: number, teamData: {
  name: string;
  description?: string;
}) => {
  try {
    console.log('🔄 Atualizando time...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/teams/${teamId}`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Dados do time:', teamData);
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.put(`/teams/${teamId}`, teamData);
    
    console.log('✅ Time atualizado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar time:', error);
    throw error;
  }
};

// Deletar time
export const deleteTeam = async (token: string, teamId: number) => {
  try {
    console.log('🔄 Deletando time...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/teams/${teamId}`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.delete(`/teams/${teamId}`);
    
    console.log('✅ Time deletado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao deletar time:', error);
    throw error;
  }
};

// Buscar membros de um time
export const getTeamMembers = async (token: string, teamId: number) => {
  try {
    console.log('🔄 Buscando membros do time...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/teams/${teamId}/agents`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get(`/teams/${teamId}/agents`);
    
    console.log('✅ Membros do time recebidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar membros do time:', error);
    throw error;
  }
};

// Adicionar agente ao time
export const addAgentToTeam = async (token: string, teamId: number, agentId: number) => {
  try {
    console.log('🔄 Adicionando agente ao time...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/teams/${teamId}/agents`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.post(`/teams/${teamId}/agents`, { agent_id: agentId });
    
    console.log('✅ Agente adicionado ao time com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao adicionar agente ao time:', error);
    throw error;
  }
};

// Remover agente do time
export const removeAgentFromTeam = async (token: string, teamId: number, agentId: number) => {
  try {
    console.log('🔄 Removendo agente do time...');
    console.log('📍 URL de destino:', `${API_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/teams/${teamId}/agents/${agentId}`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.delete(`/teams/${teamId}/agents/${agentId}`);
    
    console.log('✅ Agente removido do time com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao remover agente do time:', error);
    throw error;
  }
}; 