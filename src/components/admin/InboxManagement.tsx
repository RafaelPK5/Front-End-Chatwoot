'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getInboxes, createInbox, updateInbox, deleteInbox, createInboxViaN8N, syncInboxes } from '../../lib/api/chatwootAPI';

interface Inbox {
  id: number;
  name: string;
  channel_type: string;
  platform_type?: 'maturation' | 'digital_platform';
  account_id: number;
}

interface InstanceItem extends Inbox {
  isEvolutionInstance?: boolean;
  status?: string;
  evolutionData?: {
    connectionStatus: string;
    ownerJid: string;
    profileName: string;
    integration: string;
    chatwootEnabled: boolean;
    chatwootName?: string;
    messageCount: number;
    contactCount: number;
    phoneNumber: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface InboxFormData {
  name: string;
  channel_type: string;
  platform_type: 'maturation' | 'digital_platform';
}

export default function InboxManagement() {
  const { user } = useUserStore();
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [evolutionInstances, setEvolutionInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [editingInbox, setEditingInbox] = useState<Inbox | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingInbox, setConnectingInbox] = useState<InstanceItem | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [formData, setFormData] = useState<InboxFormData>({
    name: '',
    channel_type: 'evolution_api',
    platform_type: 'digital_platform',
  });

  useEffect(() => {
    if (user?.auth_token) {
      fetchInboxes();
    } else {
      setLoading(false);
      setError('Usuário não autenticado');
    }
  }, [user?.auth_token]);

  // Monitorar quando o modal do QR code é aberto
  useEffect(() => {
    if (showQRModal && qrCodeData) {
      console.log('🎯 Modal do QR Code aberto');
      console.log('📏 Tamanho do QR Code:', qrCodeData.length);
      console.log('🔍 Estado do modal:', { showQRModal, hasQrCodeData: !!qrCodeData });
      console.log('🎯 RENDERIZANDO MODAL DO QR CODE:', { showQRModal, hasQrCodeData: !!qrCodeData, qrCodeLength: qrCodeData?.length });
    }
  }, [showQRModal, qrCodeData]);

  const fetchInboxes = async () => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar inboxes do Chatwoot
      const chatwootResponse = await getInboxes(user.auth_token);
      const chatwootInboxes = chatwootResponse.payload || chatwootResponse.data || [];
      setInboxes(Array.isArray(chatwootInboxes) ? chatwootInboxes : []);
      
      // Buscar instâncias da Evolution API
      const evolutionResponse = await fetch('/api/evolution/instances', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': user.auth_token
        }
      });
      
             if (evolutionResponse.ok) {
         const evolutionData = await evolutionResponse.json();
         console.log('📡 Dados da Evolution API recebidos:', evolutionData);
         setEvolutionInstances(evolutionData.instances || []);
         console.log('✅ Evolution instances definidas:', evolutionData.instances?.length || 0);
       } else {
         console.warn('Não foi possível buscar instâncias da Evolution API');
         setEvolutionInstances([]);
       }
      
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar dados. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInbox = async () => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      return;
    }
    
    if (!formData.name.trim()) {
      setError('Nome do inbox é obrigatório');
      return;
    }
    
    try {
      setError(null);
      
      // Usar a nova função que integra com N8N
      const result = await createInboxViaN8N(user.auth_token, formData);
      
      console.log('✅ Resposta do N8N:', result);
             console.log('📝 Dados da resposta:', {
         hasBase64: !!result.n8n?.n8n?.base64,
         hasMsg: !!result.n8n?.msg,
         msg: result.n8n?.msg,
         success: result.n8n?.success
       });
      
                     // Verificar se já existe uma instância com esse nome
        if (result.n8n?.msg && result.n8n.msg === 'Essa instancia ja existe!') {
          alert('❌ Erro: Essa instância já existe!');
          setShowCreateModal(false);
          setFormData({ name: '', channel_type: 'evolution_api', platform_type: 'digital_platform' });
          return;
        }
        
        // Se veio QR code, exibir modal ANTES de resetar o formulário
        if (result.n8n?.n8n?.base64) {
          console.log('🔄 Exibindo QR Code...');
          console.log('📝 QR Code data:', result.n8n.n8n.base64.substring(0, 50) + '...');
          console.log('🎯 Abrindo modal do QR Code...');
          
          // Fechar modal de criação primeiro
          setShowCreateModal(false);
          
          // Configurar QR code e abrir modal
          setQrCodeData(result.n8n.n8n.base64);
          setShowQRModal(true);
          
          console.log('✅ Modal do QR Code deve estar aberto agora');
          console.log('🔍 Estado do modal:', { showQRModal: true, hasQrCodeData: !!result.n8n.n8n.base64 });
          
          // Resetar formulário após configurar o QR code
          setFormData({ name: '', channel_type: 'evolution_api', platform_type: 'digital_platform' });
          fetchInboxes();
          
          return; // Sair da função aqui para não executar o else
        }
       
       // Se não veio QR code, fechar modal e mostrar sucesso
       setShowCreateModal(false);
       setFormData({ name: '', channel_type: 'evolution_api', platform_type: 'digital_platform' });
       fetchInboxes();
       alert('✅ Inbox criada com sucesso!');
      
    } catch (err: any) {
      console.error('Erro ao criar inbox:', err);
      setError(err.message || 'Erro ao criar inbox. Verifique o console para mais detalhes.');
    }
  };

  const handleEditInbox = async () => {
    if (!user?.auth_token || !editingInbox) {
      setError('Token de autenticação não encontrado ou inbox não selecionado');
      return;
    }
    
    if (!formData.name.trim()) {
      setError('Nome do inbox é obrigatório');
      return;
    }
    
    try {
      setError(null);
      await updateInbox(user.auth_token, editingInbox.id, formData);
      setShowEditModal(false);
      setEditingInbox(null);
      setFormData({ name: '', channel_type: 'evolution_api', platform_type: 'digital_platform' });
      fetchInboxes();
    } catch (err: any) {
      console.error('Erro ao atualizar inbox:', err);
      setError(err.message || 'Erro ao atualizar inbox. Verifique o console para mais detalhes.');
    }
  };

  const handleDeleteInbox = async (inboxId: number) => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      return;
    }
    
    if (!confirm('Tem certeza que deseja deletar este inbox?')) return;
    
    try {
      setError(null);
      await deleteInbox(user.auth_token, inboxId);
      fetchInboxes();
    } catch (err: any) {
      console.error('Erro ao deletar inbox:', err);
      setError(err.message || 'Erro ao deletar inbox. Verifique o console para mais detalhes.');
    }
  };

  const handleDeleteMaturationInstance = async (instance: InstanceItem) => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir a instância de maturação "${instance.name}"?`)) return;
    
    try {
      setError(null);
      
      console.log('🗑️ Excluindo instância de maturação:', instance.name);
      
      // Chamar endpoint para excluir instância da Evolution API
      const response = await fetch('/api/evolution/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': user.auth_token
        },
        body: JSON.stringify({
          instanceName: instance.name
        })
      });
      
      const result = await response.json();
      
      console.log('✅ Resposta da exclusão:', result);
      
      if (result.success) {
        alert(`✅ Instância "${instance.name}" excluída com sucesso!`);
        fetchInboxes(); // Recarregar lista
      } else {
        alert(`❌ Erro ao excluir instância: ${result.error || 'Erro desconhecido'}`);
      }
      
    } catch (err: any) {
      console.error('Erro ao excluir instância de maturação:', err);
      setError(err.message || 'Erro ao excluir instância de maturação. Verifique o console para mais detalhes.');
    }
  };

  const openEditModal = (inbox: Inbox) => {
    setEditingInbox(inbox);
    setFormData({
      name: inbox.name,
      channel_type: inbox.channel_type,
      platform_type: inbox.platform_type || 'digital_platform',
    });
    setShowEditModal(true);
  };

  const getChannelTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      evolution_api: 'Evolution API',
      web: 'Web',
      api: 'API',
      email: 'Email',
      telegram: 'Telegram',
      whatsapp: 'WhatsApp',
      line: 'Line',
      sms: 'SMS'
    };
    return types[type] || type;
  };

  const getPlatformTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      digital_platform: 'Plataforma Digital',
      maturation: 'Maturação'
    };
    return types[type] || type;
  };

  // Função para normalizar nomes (remover hífens, espaços, etc.)
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[-\s_]/g, '') // Remove hífens, espaços e underscores
      .replace(/[^a-z0-9]/g, ''); // Remove caracteres especiais
  };

  // Função para encontrar instância da Evolution que corresponde ao inbox do Chatwoot
  const findMatchingEvolutionInstance = (chatwootName: string) => {
    const normalizedChatwootName = normalizeName(chatwootName);
    
    return evolutionInstances.find(instance => {
      const normalizedInstanceName = normalizeName(instance.name);
      const normalizedChatwootNameInInstance = instance.Chatwoot?.nameInbox ? 
        normalizeName(instance.Chatwoot.nameInbox) : '';
      
      // Verificar se o nome da instância ou o nome no Chatwoot corresponde
      return normalizedInstanceName === normalizedChatwootName || 
             normalizedChatwootNameInInstance === normalizedChatwootName;
    });
  };

    // Função para classificar instâncias e gerar lista completa
  const getClassifiedInstances = (): InstanceItem[] => {
    console.log('🔍 Classificando instâncias:', {
      evolutionInstancesCount: evolutionInstances.length,
      chatwootInboxesCount: inboxes.length
    });
    
    const result: InstanceItem[] = [];
    
    // 1. Processar inboxes do Chatwoot (Plataforma Digital)
    inboxes.forEach(inbox => {
      const matchingEvolutionInstance = findMatchingEvolutionInstance(inbox.name);
      
      console.log('📋 Inbox do Chatwoot:', {
        name: inbox.name,
        hasMatchingEvolution: !!matchingEvolutionInstance,
        evolutionName: matchingEvolutionInstance?.name,
        evolutionStatus: matchingEvolutionInstance?.connectionStatus
      });
      
      if (matchingEvolutionInstance) {
        // Inbox do Chatwoot com dados da Evolution (Plataforma Digital)
        result.push({
          ...inbox,
          isEvolutionInstance: false,
          platform_type: 'digital_platform',
          status: matchingEvolutionInstance.connectionStatus || 'unknown',
          evolutionData: {
            connectionStatus: matchingEvolutionInstance.connectionStatus,
            ownerJid: matchingEvolutionInstance.ownerJid,
            profileName: matchingEvolutionInstance.profileName,
            integration: matchingEvolutionInstance.integration,
            chatwootEnabled: matchingEvolutionInstance.Chatwoot?.enabled || false,
            chatwootName: matchingEvolutionInstance.Chatwoot?.nameInbox,
            messageCount: matchingEvolutionInstance._count?.Message || 0,
            contactCount: matchingEvolutionInstance._count?.Contact || 0,
            phoneNumber: matchingEvolutionInstance.ownerJid?.split('@')[0] || 'N/A',
            createdAt: matchingEvolutionInstance.createdAt,
            updatedAt: matchingEvolutionInstance.updatedAt
          }
        });
      } else {
        // Inbox do Chatwoot sem correspondência na Evolution
        result.push({
          ...inbox,
          isEvolutionInstance: false,
          platform_type: 'digital_platform',
          status: 'not_found',
          evolutionData: undefined
        });
      }
    });
    
         // 2. Processar instâncias da Evolution que não estão no Chatwoot (Maturação)
     let maturationCounter = 1; // Contador para gerar IDs únicos
     evolutionInstances.forEach(evolutionInstance => {
       const isInChatwoot = inboxes.some(inbox => {
         const normalizedInboxName = normalizeName(inbox.name);
         const normalizedEvolutionName = normalizeName(evolutionInstance.name);
         const normalizedChatwootNameInInstance = evolutionInstance.Chatwoot?.nameInbox ? 
           normalizeName(evolutionInstance.Chatwoot.nameInbox) : '';
         
         return normalizedInboxName === normalizedEvolutionName || 
                normalizedChatwootNameInInstance === normalizedInboxName;
       });
       
       if (!isInChatwoot) {
         // Instância da Evolution sem correspondência no Chatwoot (Maturação)
         console.log('🌱 Instância de Maturação:', {
           name: evolutionInstance.name,
           status: evolutionInstance.connectionStatus
         });
         
         result.push({
           id: -maturationCounter, // ID negativo único para distinguir de inboxes do Chatwoot
           name: evolutionInstance.name,
           channel_type: 'evolution_api',
           platform_type: 'maturation',
           account_id: 0,
           isEvolutionInstance: true,
           status: evolutionInstance.connectionStatus || 'unknown',
           evolutionData: {
             connectionStatus: evolutionInstance.connectionStatus,
             ownerJid: evolutionInstance.ownerJid,
             profileName: evolutionInstance.profileName,
             integration: evolutionInstance.integration,
             chatwootEnabled: evolutionInstance.Chatwoot?.enabled || false,
             chatwootName: evolutionInstance.Chatwoot?.nameInbox,
             messageCount: evolutionInstance._count?.Message || 0,
             contactCount: evolutionInstance._count?.Contact || 0,
             phoneNumber: evolutionInstance.ownerJid?.split('@')[0] || 'N/A',
             createdAt: evolutionInstance.createdAt,
             updatedAt: evolutionInstance.updatedAt
           }
         });
         
         maturationCounter++; // Incrementar contador para próximo ID único
       }
     });
    
    return result;
  };

  // Lista completa: apenas inboxes do Chatwoot com dados da Evolution
  const allInstances: InstanceItem[] = getClassifiedInstances();

  console.log('📊 Lista final de instâncias:', {
    total: allInstances.length,
    chatwoot: inboxes.length,
    evolution: evolutionInstances.length,
    allInstances: allInstances.map(i => ({ name: i.name, type: i.isEvolutionInstance ? 'evolution' : 'chatwoot' }))
  });

  // Estatísticas para exibição
  const stats = {
    total: allInstances.length,
    chatwoot: inboxes.length,
    evolution: evolutionInstances.length,
    digitalPlatform: allInstances.filter(i => i.platform_type === 'digital_platform').length,
    maturation: allInstances.filter(i => i.platform_type === 'maturation').length,
    withEvolutionData: allInstances.filter(i => i.evolutionData).length,
    withoutEvolutionData: allInstances.filter(i => !i.evolutionData).length,
    connected: allInstances.filter(i => i.status === 'open').length,
    disconnected: allInstances.filter(i => i.status === 'close').length,
    connecting: allInstances.filter(i => i.status === 'connecting').length
  };

  const handleSyncInboxes = async () => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      return;
    }
    
    try {
      setSyncing(true);
      setError(null);
      
      const result = await syncInboxes(user.auth_token);
      setSyncResult(result);
      
      console.log('✅ Sincronização concluída:', result);
      alert(`✅ Sincronização concluída!\n\nMaturação: ${result.maturationInboxes.length} inboxes\nPlataforma Digital: ${result.digitalPlatformInboxes.length} inboxes`);
      
      // Recarregar inboxes após sincronização
      fetchInboxes();
      
    } catch (err: any) {
      console.error('Erro na sincronização:', err);
      setError(err.message || 'Erro na sincronização. Verifique o console para mais detalhes.');
    } finally {
      setSyncing(false);
    }
  };

  const testEvolutionAPI = async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/evolution/test');
      const result = await response.json();
      
      console.log('🧪 Teste da Evolution API:', result);
      
      if (result.success) {
        alert(`✅ Evolution API funcionando!\n\nConectividade: ✅\nInstâncias: ✅\n\nVersão: ${result.testData?.version || 'N/A'}`);
      } else {
        alert(`❌ Erro na Evolution API:\n\nConectividade: ${result.connectivity ? '✅' : '❌'}\nInstâncias: ${result.instances ? '✅' : '❌'}\n\nErro: ${result.error}`);
      }
      
    } catch (err: any) {
      console.error('Erro no teste da Evolution API:', err);
      setError(err.message || 'Erro no teste da Evolution API');
    }
  };

  const handleConnectInstance = async (instance: InstanceItem) => {
    if (!user?.auth_token || !instance.evolutionData) {
      setError('Token de autenticação não encontrado ou instância sem dados da Evolution');
      return;
    }
    
    try {
      setConnecting(true);
      setError(null);
      
      // Usar o nome da instância da Evolution API em vez do nome do inbox do Chatwoot
      const evolutionInstanceName = instance.evolutionData.chatwootName || instance.name;
      
      console.log('🔗 Conectando instância:', {
        chatwootName: instance.name,
        evolutionName: evolutionInstanceName
      });
      
      // Chamar o endpoint de conexão via N8N
      const response = await fetch('/api/evolution/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': user.auth_token
        },
        body: JSON.stringify({
          inboxName: evolutionInstanceName
        })
      });
      
      const result = await response.json();
      
      console.log('✅ Resposta da conexão:', result);
      
      if (result.success && result.qrCode) {
        // Configurar QR code e abrir modal
        setQrCodeData(result.qrCode);
        setConnectingInbox(instance);
        setShowConnectModal(true);
      } else {
        alert(`❌ Erro ao conectar: ${result.error || 'Erro desconhecido'}`);
      }
      
    } catch (err: any) {
      console.error('Erro ao conectar instância:', err);
      setError(err.message || 'Erro ao conectar instância. Verifique o console para mais detalhes.');
    } finally {
      setConnecting(false);
    }
  };

  const openConnectModal = (instance: InstanceItem) => {
    setConnectingInbox(instance);
    setShowConnectModal(true);
  };





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
           <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Inboxes</h1>
           <p className="text-gray-600">Gerencie os canais de comunicação da sua empresa</p>
         </div>
                   <div className="flex space-x-3">
            <button
              onClick={testEvolutionAPI}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Testar Evolution API
            </button>
            <button
              onClick={handleSyncInboxes}
              disabled={syncing}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Novo Inbox
            </button>
          </div>
       </div>

             {/* Error Message */}
       {error && (
         <div className="bg-red-50 border border-red-200 rounded-md p-4">
           <p className="text-red-700">{error}</p>
         </div>
       )}

               {/* Statistics Panel */}
                 <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
           <div className="bg-white p-4 rounded-lg shadow">
             <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
             <div className="text-sm text-gray-600">Total</div>
           </div>
           <div className="bg-white p-4 rounded-lg shadow">
             <div className="text-2xl font-bold text-blue-600">{stats.digitalPlatform}</div>
             <div className="text-sm text-gray-600">Plataforma Digital</div>
           </div>
           <div className="bg-white p-4 rounded-lg shadow">
             <div className="text-2xl font-bold text-orange-600">{stats.maturation}</div>
             <div className="text-sm text-gray-600">Maturação</div>
           </div>
           <div className="bg-white p-4 rounded-lg shadow">
             <div className="text-2xl font-bold text-purple-600">{stats.evolution}</div>
             <div className="text-sm text-gray-600">Evolution</div>
           </div>
           <div className="bg-white p-4 rounded-lg shadow">
             <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
             <div className="text-sm text-gray-600">Conectadas</div>
           </div>
           <div className="bg-white p-4 rounded-lg shadow">
             <div className="text-2xl font-bold text-red-600">{stats.disconnected}</div>
             <div className="text-sm text-gray-600">Desconectadas</div>
           </div>
           <div className="bg-white p-4 rounded-lg shadow">
             <div className="text-2xl font-bold text-yellow-600">{stats.connecting}</div>
             <div className="text-sm text-gray-600">Conectando</div>
           </div>
         </div>



      {/* Inboxes List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
                     <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
             Instâncias ({allInstances.length})
           </h3>
           
           {allInstances.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
                             <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma instância encontrada</h3>
               <p className="mt-1 text-sm text-gray-500">Comece criando sua primeira instância.</p>
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
                       Tipo
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Plataforma
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Status
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Ações
                     </th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                                      {allInstances.map((instance) => (
                     <tr key={instance.id} className="hover:bg-gray-50">
                                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {instance.name}
                          {instance.evolutionData && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Evolution
                            </span>
                          )}
                          {!instance.evolutionData && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Sem Evolution
                            </span>
                          )}
                        </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {getChannelTypeLabel(instance.channel_type)}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                           instance.platform_type === 'digital_platform' 
                             ? 'bg-blue-100 text-blue-800' 
                             : 'bg-orange-100 text-orange-800'
                         }`}>
                           {getPlatformTypeLabel(instance.platform_type || 'digital_platform')}
                         </span>
                       </td>
                                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {instance.evolutionData ? (
                            <div className="space-y-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                instance.status === 'open' 
                                  ? 'bg-green-100 text-green-800' 
                                  : instance.status === 'connecting'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : instance.status === 'close'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {instance.status || 'unknown'}
                              </span>
                                                             <div className="text-xs text-gray-400">
                                 <div>📱 {instance.evolutionData.profileName || 'N/A'}</div>
                                 <div>📞 {instance.evolutionData.phoneNumber}</div>
                                 <div>💬 {instance.evolutionData.messageCount} msgs</div>
                                 <div>👥 {instance.evolutionData.contactCount} contatos</div>
                               </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Sem dados da Evolution</span>
                          )}
                        </td>
                                                                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {/* Botões de Editar/Deletar apenas para inboxes do Chatwoot */}
                            {!instance.isEvolutionInstance && (
                              <>
                                <button
                                  onClick={() => openEditModal(instance)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteInbox(instance.id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Deletar
                                </button>
                              </>
                            )}
                            
                                                         {/* Botão Conectar para todas as instâncias com dados da Evolution */}
                             {instance.evolutionData && (instance.status === 'close' || instance.status === 'connecting') && (
                               <button
                                 onClick={() => handleConnectInstance(instance)}
                                 disabled={connecting}
                                 className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                               >
                                 <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                 </svg>
                                 {connecting ? 'Conectando...' : 'Conectar'}
                               </button>
                             )}
                             
                             {/* Botão Excluir para instâncias de maturação */}
                             {instance.isEvolutionInstance && (
                               <button
                                 onClick={() => handleDeleteMaturationInstance(instance)}
                                 className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                               >
                                 <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                 </svg>
                                 Excluir
                               </button>
                             )}
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
             <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Inbox</h3>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700">Nome</label>
                 <input
                   type="text"
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                   placeholder="Nome do inbox"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700">Tipo de Canal</label>
                 <select
                   value={formData.channel_type}
                   onChange={(e) => setFormData({ ...formData, channel_type: e.target.value })}
                   className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                 >
                   <option value="evolution_api" className="text-gray-900 bg-white hover:bg-gray-100">Evolution API</option>
                 </select>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700">Tipo de Plataforma</label>
                 <select
                   value={formData.platform_type}
                   onChange={(e) => setFormData({ ...formData, platform_type: e.target.value as 'digital_platform' | 'maturation' })}
                   className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                 >
                   <option value="digital_platform" className="text-gray-900 bg-white hover:bg-gray-100">Plataforma Digital</option>
                   <option value="maturation" className="text-gray-900 bg-white hover:bg-gray-100">Maturação</option>
                 </select>
                 <p className="mt-1 text-xs text-gray-500">
                   <strong>Plataforma Digital:</strong> Cria inbox no Chatwoot<br/>
                   <strong>Maturação:</strong> Só cria instância na Evolution API
                 </p>
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
                onClick={handleCreateInbox}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingInbox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Inbox</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nome do inbox"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Canal</label>
                <select
                  value={formData.channel_type}
                  onChange={(e) => setFormData({ ...formData, channel_type: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                >
                  <option value="evolution_api" className="text-gray-900 bg-white hover:bg-gray-100">Evolution API</option>
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
                onClick={handleEditInbox}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Salvar
              </button>
            </div>
          </div>
                 </div>
       )}

                                                               {/* QR Code Modal */}
          {showQRModal && qrCodeData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 9999 }}>
             <div className="bg-white rounded-lg p-6 w-full max-w-md">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-medium text-gray-900">QR Code para WhatsApp</h3>
                 <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                   ✅ Instância Criada
                 </div>
               </div>
               
                             <div className="text-center">
                 <div className="bg-gray-100 p-4 rounded-lg mb-4">
                   <p className="text-sm text-gray-600 mb-2">QR Code carregando...</p>
                   <img 
                     src={qrCodeData}
                     alt="QR Code WhatsApp" 
                     className="mx-auto max-w-full h-auto"
                     style={{ maxHeight: '300px' }}
                     onLoad={() => console.log('✅ QR Code carregado com sucesso')}
                     onError={(e) => console.error('❌ Erro ao carregar QR Code:', e)}
                   />
                 </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Escaneie este QR Code com seu WhatsApp para conectar a inbox
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-xs text-blue-800">
                    <strong>Dica:</strong> Abra o WhatsApp → Configurações → Aparelhos conectados → Conectar um dispositivo
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connect Modal */}
        {showConnectModal && qrCodeData && connectingInbox && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reconectar WhatsApp</h3>
                <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                  🔄 Reconectando
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-2">QR Code para reconexão...</p>
                  <img 
                    src={qrCodeData}
                    alt="QR Code WhatsApp" 
                    className="mx-auto max-w-full h-auto"
                    style={{ maxHeight: '300px' }}
                    onLoad={() => console.log('✅ QR Code de reconexão carregado')}
                    onError={(e) => console.error('❌ Erro ao carregar QR Code de reconexão:', e)}
                  />
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Escaneie este QR Code para reconectar a instância <strong>{connectingInbox.name}</strong>
                </p>
                
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
                  <p className="text-xs text-orange-800">
                    <strong>Importante:</strong> Esta instância estava desconectada. Após escanear, ela voltará a funcionar normalmente.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    setQrCodeData(null);
                    setConnectingInbox(null);
                    fetchInboxes(); // Recarregar para verificar se conectou
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
     </div>
   );
 } 