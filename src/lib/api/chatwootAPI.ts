import axios from 'axios';

// URL direta do Chatwoot
const CHATWOOT_API_URL = 'http://212.85.17.18:8081';
const ACCOUNT_ID = '1';

// Cliente base sem token
const createBaseClient = () => {
  return axios.create({
    baseURL: '/api/chatwoot',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    timeout: 10000, // 10 segundos de timeout
  });
};

// Cliente autenticado - usando a URL direta do Chatwoot
const createAuthenticatedClient = (token: string) => {
  return axios.create({
    baseURL: `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}`,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
      'api_access_token': token, // Manter ambos para compatibilidade
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
    return { success: true, url: '/api/chatwoot' };
  } catch (error: any) {
    console.error('Erro ao conectar com a API:', error.response?.data || error.message);
    return { success: false, url: null };
  }
};

// Teste específico para conversas com autenticação
export const testConversationsAPI = async (token: string) => {
  try {
    console.log('🧪 Testando API de conversas com autenticação...');
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get('/conversations');
    
    console.log('📊 Resposta do teste de conversas:', {
      status: response.status,
      statusText: response.statusText,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      keys: response.data ? Object.keys(response.data) : 'null/undefined',
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro no teste de conversas:', error);
    throw error;
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
    console.log('🔄 Buscando conversas com token:', token.substring(0, 10) + '...');
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get('/conversations');
    
    console.log('📊 Resposta das conversas:', {
      status: response.status,
      statusText: response.statusText,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      keys: response.data ? Object.keys(response.data) : 'null/undefined',
      data: response.data
    });
    
    // Log detalhado da estrutura da resposta
    if (response.data && typeof response.data === 'object') {
      console.log('🔍 Estrutura detalhada da resposta:');
      console.log('  - response.data:', response.data);
      if (response.data.payload) {
        console.log('  - response.data.payload:', response.data.payload);
        console.log('  - Tipo do payload:', typeof response.data.payload);
        console.log('  - É array?', Array.isArray(response.data.payload));
      }
      if (response.data.data) {
        console.log('  - response.data.data:', response.data.data);
        console.log('  - Tipo do data:', typeof response.data.data);
        console.log('  - É array?', Array.isArray(response.data.data));
      }
      if (response.data.conversations) {
        console.log('  - response.data.conversations:', response.data.conversations);
        console.log('  - Tipo do conversations:', typeof response.data.conversations);
        console.log('  - É array?', Array.isArray(response.data.conversations));
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar conversas:', error);
    throw error;
  }
};

// Buscar agentes (para admin) - endpoint correto da API
export const getAgents = async (token: string) => {
  try {
    console.log('🔄 Iniciando busca de agentes via API route...');
    
    // Usar diretamente a API route do Next.js para evitar CORS
    const fallbackClient = axios.create({
      baseURL: '/api/chatwoot',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`,
        'api_access_token': token,
      },
    });
    
    const response = await fallbackClient.get(`/api/v1/accounts/${ACCOUNT_ID}/agents`);
    console.log('✅ Agentes carregados via API route:', response.data);
    console.log('🔍 Estrutura da resposta de agents:', {
      type: typeof response.data,
      isArray: Array.isArray(response.data),
      keys: response.data ? Object.keys(response.data) : 'null/undefined',
      payload: response.data.payload,
      payloadType: typeof response.data.payload,
      payloadIsArray: Array.isArray(response.data.payload)
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar agentes:', error);
    console.error('❌ Detalhes do erro:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      code: error.code
    });
    
    // Retornar dados padrão em caso de erro
    console.log('⚠️ Retornando dados padrão para agentes');
    return { payload: [] };
  }
};

// Buscar estatísticas da conta (para admin) - endpoint correto da API
export const getAccountStats = async (token: string) => {
  try {
    console.log('🔄 Iniciando busca de estatísticas...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/account`);
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
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}`);
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
    console.log('🔄 Iniciando busca de inboxes via API route...');
    
    // Usar diretamente a API route do Next.js para evitar CORS
    const fallbackClient = axios.create({
      baseURL: '/api/chatwoot',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`,
        'api_access_token': token,
      },
    });
    
    const response = await fallbackClient.get(`/api/v1/accounts/${ACCOUNT_ID}/inboxes`);
    console.log('✅ Inboxes carregados via API route:', response.data);
    console.log('📊 Tipo da resposta:', typeof response.data);
    console.log('📊 É array?', Array.isArray(response.data));
    console.log('📊 Chaves da resposta:', response.data ? Object.keys(response.data) : 'null/undefined');
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar inboxes:', error);
    console.error('❌ Detalhes do erro:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      code: error.code
    });
    
    // Retornar dados padrão em caso de erro
    console.log('⚠️ Retornando dados padrão para inboxes');
    return { payload: [] };
  }
};

// Buscar conversas por inbox (para estatísticas)
export const getConversationsByInbox = async (token: string, inboxId: number) => {
  try {
    console.log('🔄 Iniciando busca de conversas do inbox:', inboxId);
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/inboxes/${inboxId}/conversations`);
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
    console.log('🔄 Iniciando busca de estatísticas de conversas via API route...');
    
    // Usar diretamente a API route do Next.js para evitar CORS
    const fallbackClient = axios.create({
      baseURL: '/api/chatwoot',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`,
        'api_access_token': token,
      },
    });
    
    const response = await fallbackClient.get(`/api/v1/accounts/${ACCOUNT_ID}/conversations`);
    console.log('✅ Estatísticas de conversas carregadas via API route:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de conversas:', error);
    
    // Retornar dados padrão em caso de erro
    console.log('⚠️ Retornando dados padrão para conversas');
    return { payload: [] };
  }
};



// Criar novo inbox
export const createInbox = async (token: string, inboxData: {
  name: string;
  channel_type: string;
}) => {
  try {
    console.log('🔄 Criando novo inbox...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/inboxes`);
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
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/inboxes/${inboxId}`);
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
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/inboxes/${inboxId}`);
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
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/agents`);
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
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/agents/${agentId}`);
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
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/agents/${agentId}`);
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
    
    console.log('�� Análise de sincronização:', {
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

// Buscar times da conta
export const getTeams = async (token: string) => {
  try {
    console.log('🔄 Buscando times via API route...');
    
    // Usar diretamente a API route do Next.js para evitar CORS
    const fallbackClient = axios.create({
      baseURL: '/api/chatwoot',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`,
        'api_access_token': token,
      },
    });
    
    const response = await fallbackClient.get(`/api/v1/accounts/${ACCOUNT_ID}/teams`);
    console.log('✅ Times carregados via API route:', response.data);
    console.log('🔍 Estrutura da resposta de teams:', {
      type: typeof response.data,
      isArray: Array.isArray(response.data),
      keys: response.data ? Object.keys(response.data) : 'null/undefined',
      payload: response.data.payload,
      payloadType: typeof response.data.payload,
      payloadIsArray: Array.isArray(response.data.payload)
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar times:', error);
    console.error('❌ Detalhes do erro:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      code: error.code
    });
    
    // Retornar dados padrão em caso de erro
    console.log('⚠️ Retornando dados padrão para times');
    return { payload: [] };
  }
};

// Criar novo time
export const createTeam = async (token: string, teamData: {
  name: string;
  description?: string;
}) => {
  try {
    console.log('🔄 Criando novo time...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/teams`);
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
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/teams/${teamId}`);
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
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/teams/${teamId}`);
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
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/teams/${teamId}/agents`);
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
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/teams/${teamId}/agents`);
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
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/teams/${teamId}/agents/${agentId}`);
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

// ===== FUNÇÕES PARA PERMISSÕES DO USUÁRIO =====

// Buscar permissões do usuário logado
export const getUserPermissions = async (token: string, userId: number) => {
  try {
    console.log('🔄 Buscando permissões do usuário...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/agents/${userId}`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get(`/agents/${userId}`);
    
    console.log('✅ Permissões do usuário recebidas:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar permissões do usuário:', error);
    // Retornar dados básicos em caso de erro
    return {
      payload: {
        id: userId,
        role: 'agent', // Fallback para agent
        permissions: []
      }
    };
  }
};

// Buscar inboxes que o usuário tem acesso
export const getUserInboxes = async (token: string, userId: number) => {
  try {
    console.log('🔄 Buscando inboxes do usuário...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/agents/${userId}/inboxes`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get(`/agents/${userId}/inboxes`);
    
    console.log('✅ Inboxes do usuário recebidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar inboxes do usuário:', error);
    // Se o endpoint não existir, buscar todos os inboxes como fallback
    try {
      console.log('🔄 Tentando buscar todos os inboxes como fallback...');
      const allInboxes = await getInboxes(token);
      return allInboxes;
    } catch (fallbackError) {
      console.error('❌ Erro no fallback de inboxes:', fallbackError);
      return { payload: [] };
    }
  }
};

// Buscar times que o usuário pertence
export const getUserTeams = async (token: string, userId: number) => {
  try {
    console.log('🔄 Buscando times do usuário...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/agents/${userId}/teams`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get(`/agents/${userId}/teams`);
    
    console.log('✅ Times do usuário recebidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar times do usuário:', error);
    // Se o endpoint não existir, buscar todos os times como fallback
    try {
      console.log('🔄 Tentando buscar todos os times como fallback...');
      const allTeams = await getTeams(token);
      return allTeams;
    } catch (fallbackError) {
      console.error('❌ Erro no fallback de times:', fallbackError);
      return { payload: [] };
    }
  }
};

// Buscar conversas filtradas por permissões do usuário
export const getFilteredConversations = async (token: string, userId: number) => {
  try {
    console.log('🔄 Buscando conversas filtradas para o usuário...');
    
    // Primeiro, buscar as permissões do usuário
    const userPermissions = await getUserPermissions(token, userId);
    const userInboxes = await getUserInboxes(token, userId);
    const userTeams = await getUserTeams(token, userId);
    
    console.log('📊 Permissões encontradas:', {
      userPermissions,
      userInboxes: userInboxes.payload || [],
      userTeams: userTeams.payload || []
    });
    
    // Se o usuário é administrador, retornar todas as conversas
    if (userPermissions.payload?.role === 'administrator') {
      console.log('👑 Usuário é administrador, retornando todas as conversas');
      return await getConversations(token);
    }
    
    // Para agentes, tentar filtrar por inboxes e times
    const accessibleInboxIds = (userInboxes.payload || []).map((inbox: any) => inbox.id);
    const accessibleTeamIds = (userTeams.payload || []).map((team: any) => team.id);
    
    console.log('🎯 Filtros aplicados:', {
      accessibleInboxIds,
      accessibleTeamIds
    });
    
    // Buscar todas as conversas
    const allConversations = await getConversations(token);
    
    // Se não conseguimos obter permissões específicas, retornar todas as conversas
    if (accessibleInboxIds.length === 0 && accessibleTeamIds.length === 0) {
      console.log('⚠️ Não foi possível obter permissões específicas, retornando todas as conversas');
      return allConversations;
    }
    
    // Filtrar conversas baseado nas permissões
    const filteredConversations = allConversations.payload?.filter((conversation: any) => {
      // Verificar se a conversa está em um inbox acessível
      const hasInboxAccess = accessibleInboxIds.includes(conversation.inbox_id);
      
      // Verificar se a conversa está em um time acessível
      const hasTeamAccess = conversation.team_id ? accessibleTeamIds.includes(conversation.team_id) : false;
      
      // Verificar se o usuário é o agente responsável
      const isAssignedAgent = conversation.assignee_id === userId;
      
      return hasInboxAccess || hasTeamAccess || isAssignedAgent;
    }) || [];
    
    console.log('✅ Conversas filtradas:', {
      total: allConversations.payload?.length || 0,
      filtered: filteredConversations.length,
      conversations: filteredConversations
    });
    
    return {
      ...allConversations,
      payload: filteredConversations
    };
  } catch (error) {
    console.error('❌ Erro ao buscar conversas filtradas:', error);
    // Em caso de erro, retornar todas as conversas
    console.log('⚠️ Erro ao filtrar conversas, retornando todas as conversas');
    return await getConversations(token);
  }
};

// Buscar conversas de um inbox específico (para agentes)
export const getConversationsByInboxForUser = async (token: string, inboxId: number, userId: number) => {
  try {
    console.log('🔄 Buscando conversas do inbox para o usuário...');
    
    // Verificar se o usuário tem acesso ao inbox
    const userInboxes = await getUserInboxes(token, userId);
    const hasAccess = (userInboxes.payload || []).some((inbox: any) => inbox.id === inboxId);
    
    if (!hasAccess) {
      console.log('❌ Usuário não tem acesso ao inbox:', inboxId);
      throw new Error('Acesso negado ao inbox');
    }
    
    // Buscar conversas do inbox
    const conversations = await getConversationsByInbox(token, inboxId);
    
    console.log('✅ Conversas do inbox para o usuário:', conversations);
    return conversations;
  } catch (error) {
    console.error('❌ Erro ao buscar conversas do inbox para o usuário:', error);
    throw error;
  }
}; 

// ===== FUNÇÕES PARA MENSAGENS =====

// Enviar mensagem para uma conversa
export const sendMessage = async (token: string, conversationId: number, messageData: {
  content: string;
  message_type?: number;
  private?: boolean;
}) => {
  try {
    console.log('🔄 Enviando mensagem...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Dados da mensagem:', { ...messageData, content: messageData.content.substring(0, 50) + '...' });
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.post(`/conversations/${conversationId}/messages`, {
      content: messageData.content,
      message_type: messageData.message_type || 0, // 0 = incoming, 1 = outgoing
      private: messageData.private || false
    });
    
    console.log('✅ Mensagem enviada com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    throw error;
  }
};

// Buscar mensagens de uma conversa
export const getMessages = async (token: string, conversationId: number) => {
  try {
    console.log('🔄 Buscando mensagens da conversa...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get(`/conversations/${conversationId}/messages`);
    
    console.log('✅ Mensagens recebidas:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    throw error;
  }
};

// ===== FUNÇÕES PARA FILTROS DE CONVERSAS =====

// Filtrar conversas com opções avançadas
export const filterConversations = async (token: string, filterOptions: {
  payload: Array<{
    attribute_key: string;
    filter_operator: string;
    values: string[];
    query_operator?: string;
  }>;
}) => {
  try {
    console.log('🔄 Filtrando conversas...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/filter`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Filtros aplicados:', filterOptions);
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.post('/conversations/filter', filterOptions);
    
    console.log('✅ Conversas filtradas:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao filtrar conversas:', error);
    throw error;
  }
};

// Buscar contadores de conversas
export const getConversationCounts = async (token: string) => {
  try {
    console.log('🔄 Buscando contadores de conversas...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/count`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.get('/conversations/count');
    
    console.log('✅ Contadores recebidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar contadores:', error);
    throw error;
  }
};

// ===== FUNÇÕES PARA ATUALIZAÇÃO DE CONVERSAS =====

// Atualizar status da conversa
export const updateConversationStatus = async (token: string, conversationId: number, status: 'open' | 'resolved' | 'pending') => {
  try {
    console.log('🔄 Atualizando status da conversa...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/toggle_status`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Novo status:', status);
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.post(`/conversations/${conversationId}/toggle_status`, {
      status: status
    });
    
    console.log('✅ Status atualizado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    throw error;
  }
};

// Atualizar prioridade da conversa
export const updateConversationPriority = async (token: string, conversationId: number, priority: 'low' | 'medium' | 'high' | 'urgent') => {
  try {
    console.log('🔄 Atualizando prioridade da conversa...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/toggle_priority`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Nova prioridade:', priority);
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.post(`/conversations/${conversationId}/toggle_priority`, {
      priority: priority
    });
    
    console.log('✅ Prioridade atualizada com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar prioridade:', error);
    throw error;
  }
};

// Atualizar atributos customizados da conversa
export const updateConversationCustomAttributes = async (token: string, conversationId: number, customAttributes: Record<string, any>) => {
  try {
    console.log('🔄 Atualizando atributos customizados...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/custom_attributes`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Atributos:', customAttributes);
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.post(`/conversations/${conversationId}/custom_attributes`, {
      custom_attributes: customAttributes
    });
    
    console.log('✅ Atributos atualizados com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar atributos:', error);
    throw error;
  }
};

// ===== FUNÇÕES PARA LABELS =====

export interface Label {
  id: number;
  title: string;
  description?: string;
  color?: string;
  account_id: number;
  created_at: string;
  updated_at: string;
}

// Buscar labels disponíveis da conta
export const getLabels = async (token: string): Promise<Label[]> => {
  try {
    console.log('🔄 Buscando labels da conta...');
    const response = await fetch(`/api/chatwoot/api/v1/accounts/${ACCOUNT_ID}/labels`, {
      method: 'GET',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Labels recebidos:', data);
    return Array.isArray(data) ? data : (data.payload || []);
  } catch (error: any) {
    console.error('❌ Erro ao buscar labels:', error.message);
    throw new Error(`Erro ao buscar labels: ${error.message}`);
  }
};

// Criar nova label
export const createLabel = async (token: string, labelData: {
  title: string;
  description?: string;
  color?: string;
}): Promise<Label> => {
  try {
    console.log('📝 Criando nova label:', labelData);
    const response = await fetch(`/api/chatwoot/api/v1/accounts/${ACCOUNT_ID}/labels`, {
      method: 'POST',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(labelData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Label criada com sucesso:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Erro ao criar label:', error.message);
    throw new Error(`Erro ao criar label: ${error.message}`);
  }
};

// Atualizar label
export const updateLabel = async (token: string, labelId: number, labelData: {
  title?: string;
  description?: string;
  color?: string;
}): Promise<Label> => {
  try {
    console.log('📝 Atualizando label:', { id: labelId, data: labelData });
    const response = await fetch(`/api/chatwoot/api/v1/accounts/${ACCOUNT_ID}/labels/${labelId}`, {
      method: 'PATCH',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(labelData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Label atualizada com sucesso:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar label:', error.message);
    throw new Error(`Erro ao atualizar label: ${error.message}`);
  }
};

// Deletar label
export const deleteLabel = async (token: string, labelId: number): Promise<void> => {
  try {
    console.log('🗑️ Deletando label:', labelId);
    const response = await fetch(`/api/chatwoot/api/v1/accounts/${ACCOUNT_ID}/labels/${labelId}`, {
      method: 'DELETE',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('✅ Label deletada com sucesso');
  } catch (error: any) {
    console.error('❌ Erro ao deletar label:', error.message);
    throw new Error(`Erro ao deletar label: ${error.message}`);
  }
};

// Adicionar labels a uma conversa
export const addLabelsToConversation = async (token: string, conversationId: number, labels: string[]) => {
  try {
    console.log('🔄 Adicionando labels à conversa...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/labels`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Labels:', labels);
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.post(`/conversations/${conversationId}/labels`, {
      labels: labels
    });
    
    console.log('✅ Labels adicionados com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao adicionar labels:', error);
    throw error;
  }
};

// ===== FUNÇÕES PARA ATRIBUIÇÃO =====

// Atribuir conversa a um agente
export const assignConversation = async (token: string, conversationId: number, agentId: number) => {
  try {
    console.log('🔄 Atribuindo conversa ao agente...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/assignments`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    console.log('📝 Agente ID:', agentId);
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.post(`/conversations/${conversationId}/assignments`, {
      assignee_id: agentId
    });
    
    console.log('✅ Conversa atribuída com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atribuir conversa:', error);
    throw error;
  }
};

// Remover atribuição da conversa
export const unassignConversation = async (token: string, conversationId: number) => {
  try {
    console.log('🔄 Removendo atribuição da conversa...');
    console.log('📍 URL de destino:', `${CHATWOOT_API_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/assignments`);
    console.log('🔑 Token usado:', token.substring(0, 10) + '...');
    
    const apiClient = createAuthenticatedClient(token);
    const response = await apiClient.delete(`/conversations/${conversationId}/assignments`);
    
    console.log('✅ Atribuição removida com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao remover atribuição:', error);
    throw error;
  }
}; 

// ===== FUNÇÕES PARA AUTOMAÇÕES =====

// Testar diferentes endpoints de automação
export const testAutomationEndpoints = async (token: string) => {
  const endpoints = [
    '/api/v1/accounts/${ACCOUNT_ID}/automation_rules',
    '/api/v1/accounts/${ACCOUNT_ID}/macros',
    '/api/v1/accounts/${ACCOUNT_ID}/workflows',
    '/api/v1/accounts/${ACCOUNT_ID}/triggers',
    '/api/v1/accounts/${ACCOUNT_ID}/automations',
    '/api/v1/accounts/${ACCOUNT_ID}/rules'
  ];

  const apiClient = axios.create({
    baseURL: '/api/chatwoot',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
      'api_access_token': token,
    },
  });

  console.log('🔍 Testando endpoints de automação...');

  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get(endpoint);
      console.log(`✅ Endpoint ${endpoint} está disponível:`, response.data);
      return { endpoint, data: response.data };
    } catch (error: any) {
      console.log(`❌ Endpoint ${endpoint} não disponível:`, error.response?.status);
    }
  }

  console.log('⚠️ Nenhum endpoint de automação encontrado');
  return null;
};

export const getAutomations = async (token: string) => {
  try {
    console.log('🔄 Buscando regras de automação via API route...');
    
    // Primeiro, testar diferentes endpoints
    const availableEndpoint = await testAutomationEndpoints(token);
    
    if (availableEndpoint) {
      console.log('✅ Usando endpoint disponível:', availableEndpoint.endpoint);
      return availableEndpoint.data;
    }
    
    // Se nenhum endpoint específico estiver disponível, usar o padrão
    const apiClient = axios.create({
      baseURL: '/api/chatwoot',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`,
        'api_access_token': token,
      },
    });
    
    const response = await apiClient.get(`/api/v1/accounts/${ACCOUNT_ID}/automation_rules`);
    console.log('✅ Regras de automação carregadas via API route');
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar automações via API route:', error);
    
    // Se não existir endpoint de automações, retorna array vazio
    if (error.response?.status === 404) {
      console.log('ℹ️ Endpoint de automações não encontrado, retornando array vazio');
      return { payload: [] };
    }
    
    console.log('⚠️ Erro na busca de automações, retornando array vazio');
    return { payload: [] };
  }
};

// Criar nova automação
export const createAutomation = async (token: string, automationData: {
  name: string;
  description: string;
  event_name: string;
  active: boolean;
  actions: Array<{
    action_name: string;
    action_params: any[];
  }>;
  conditions: Array<{
    attribute_key: string;
    filter_operator: string;
    query_operator?: string;
    values: any[];
  }>;
}) => {
  try {
    console.log('🔄 Criando regra de automação via API route...');
    console.log('📝 Dados da regra de automação:', automationData);
    
    const apiClient = axios.create({
      baseURL: '/api/chatwoot',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`,
        'api_access_token': token,
      },
    });
    
    const response = await apiClient.post(`/api/v1/accounts/${ACCOUNT_ID}/automation_rules`, automationData);
    console.log('✅ Regra de automação criada via API route:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao criar automação via API route:', error);
    throw error;
  }
};

// Atualizar automação
export const updateAutomation = async (token: string, automationId: number, automationData: {
  name?: string;
  description?: string;
  event_name?: string;
  active?: boolean;
  actions?: Array<{
    action_name: string;
    action_params: any[];
  }>;
  conditions?: Array<{
    attribute_key: string;
    filter_operator: string;
    query_operator?: string;
    values: any[];
  }>;
}) => {
  try {
    console.log('🔄 Atualizando regra de automação via API route...');
    console.log('📝 Dados da regra de automação:', automationData);
    
    const apiClient = axios.create({
      baseURL: '/api/chatwoot',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`,
        'api_access_token': token,
      },
    });
    
    const response = await apiClient.put(`/api/v1/accounts/${ACCOUNT_ID}/automation_rules/${automationId}`, automationData);
    console.log('✅ Regra de automação atualizada via API route:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar automação via API route:', error);
    throw error;
  }
};

// Deletar automação
export const deleteAutomation = async (token: string, automationId: number) => {
  try {
    console.log('🔄 Deletando regra de automação via API route...');
    
    const apiClient = axios.create({
      baseURL: '/api/chatwoot',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`,
        'api_access_token': token,
      },
    });
    
    const response = await apiClient.delete(`/api/v1/accounts/${ACCOUNT_ID}/automation_rules/${automationId}`);
    console.log('✅ Regra de automação deletada via API route:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao deletar automação via API route:', error);
    throw error;
  }
};

// Buscar estatísticas de automações
export const getAutomationStats = async (token: string) => {
  try {
    console.log('🔄 Calculando estatísticas de regras de automação...');
    
    // Buscar todas as regras de automação para calcular estatísticas
    const automationsData = await getAutomations(token);
    const automations = automationsData.payload || automationsData.data || [];
    
    // Calcular estatísticas básicas
    const totalRules = automations.length;
    const activeRules = automations.filter((rule: any) => rule.active).length;
    
    const stats = {
      totalRules,
      activeRules,
      processedConversations: 0, // Não disponível sem endpoint específico
      todayProcessed: 0, // Não disponível sem endpoint específico
      successRate: totalRules > 0 ? 100 : 0, // Assumir 100% se há regras
      lastExecution: 'N/A' // Não disponível sem endpoint específico
    };
    
    console.log('✅ Estatísticas calculadas com sucesso:', stats);
    return stats;
  } catch (error: any) {
    console.error('❌ Erro ao calcular estatísticas de automações:', error);
    
    // Retornar dados vazios em caso de erro
    return {
      totalRules: 0,
      activeRules: 0,
      processedConversations: 0,
      todayProcessed: 0,
      successRate: 0,
      lastExecution: 'N/A'
    };
  }
};

// ===== CANNED RESPONSES / SHORTCUTS =====

// Interface para Canned Response
export interface CannedResponse {
  id: number;
  account_id: number;
  short_code: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Buscar todas as respostas rápidas
export const getCannedResponses = async (token: string): Promise<CannedResponse[]> => {
  try {
    console.log('📝 Buscando respostas rápidas...');
    const response = await fetch('/api/chatwoot/api/v1/accounts/1/canned_responses', {
      method: 'GET',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📝 Resposta da API de respostas rápidas:', {
      status: response.status,
      dataType: typeof data,
      isArray: Array.isArray(data),
      count: Array.isArray(data) ? data.length : 'N/A',
      data: data
    });

    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.payload)) {
      return data.payload;
    } else {
      console.warn('⚠️ Estrutura de resposta inesperada para respostas rápidas:', data);
      return [];
    }
  } catch (error: any) {
    console.error('❌ Erro ao buscar respostas rápidas:', error.message);
    throw new Error(`Erro ao buscar respostas rápidas: ${error.message}`);
  }
};

// Criar nova resposta rápida
export const createCannedResponse = async (token: string, cannedResponseData: {
  short_code: string;
  content: string;
}): Promise<CannedResponse> => {
  try {
    console.log('📝 Criando nova resposta rápida:', cannedResponseData);
    const response = await fetch('/api/chatwoot/api/v1/accounts/1/canned_responses', {
      method: 'POST',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cannedResponseData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Resposta rápida criada com sucesso:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Erro ao criar resposta rápida:', error.message);
    throw new Error(`Erro ao criar resposta rápida: ${error.message}`);
  }
};

// Atualizar resposta rápida existente
export const updateCannedResponse = async (token: string, cannedResponseId: number, cannedResponseData: {
  short_code?: string;
  content?: string;
}): Promise<CannedResponse> => {
  try {
    console.log('📝 Atualizando resposta rápida:', { id: cannedResponseId, data: cannedResponseData });
    const response = await fetch(`/api/chatwoot/api/v1/accounts/1/canned_responses/${cannedResponseId}`, {
      method: 'PATCH',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cannedResponseData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Resposta rápida atualizada com sucesso:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar resposta rápida:', error.message);
    throw new Error(`Erro ao atualizar resposta rápida: ${error.message}`);
  }
};

// Deletar resposta rápida
export const deleteCannedResponse = async (token: string, cannedResponseId: number): Promise<void> => {
  try {
    console.log('📝 Deletando resposta rápida:', cannedResponseId);
    const response = await fetch(`/api/chatwoot/api/v1/accounts/1/canned_responses/${cannedResponseId}`, {
      method: 'DELETE',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('✅ Resposta rápida deletada com sucesso');
  } catch (error: any) {
    console.error('❌ Erro ao deletar resposta rápida:', error.message);
    throw new Error(`Erro ao deletar resposta rápida: ${error.message}`);
  }
};