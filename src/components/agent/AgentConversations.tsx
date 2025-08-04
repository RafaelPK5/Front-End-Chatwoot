'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../store/userStore';
import { getConversations, getConversation, sendMessage, testConversationsAPI } from '../../lib/api/chatwootAPI';
import AgentLayout from './AgentLayout';
import ConversationItem from './ConversationItem';
import MessageBubble from './MessageBubble';
import UserPermissionsInfo from './UserPermissionsInfo';
import ConversationStats from './ConversationStats';

export interface Conversation {
  id: number;
  inbox_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  contact: {
    id: number;
    name: string;
    email: string;
    phone_number: string;
  };
  messages: Message[];
  last_message?: {
    content: string;
    created_at: string;
  };
  team_id?: number;
  assignee_id?: number;
}

interface Message {
  id: number;
  content: string;
  message_type: number;
  created_at: string;
  sender: {
    id: number;
    name: string;
    type: string;
  };
}

export default function AgentConversations() {
  const { user } = useUserStore();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [conversationStats, setConversationStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.auth_token) return;
      
      try {
        setLoading(true);
        console.log('🔄 Buscando conversas para o usuário:', user.id);
        
        // Usar a função simples de buscar conversas
        const data = await getConversations(user.auth_token);
        console.log('🔍 Estrutura completa da resposta:', data);
        console.log('🔍 Tipos de dados:', {
          dataType: typeof data,
          isArray: Array.isArray(data),
          keys: data ? Object.keys(data) : 'null/undefined'
        });
        
        // Processar dados das conversas seguindo o mesmo padrão do AdminDashboard
        let conversationsArray = [];
        if (Array.isArray(data)) {
          conversationsArray = data;
        } else if (data && typeof data === 'object') {
          conversationsArray = data.data?.payload || data.payload || data.data || data.conversations || [];
        }
        
        if (!Array.isArray(conversationsArray)) {
          console.warn('⚠️ Dados de conversas não são um array:', conversationsArray);
          conversationsArray = [];
        }
        
        setConversations(conversationsArray);
        
        console.log('✅ Conversas carregadas:', {
          total: conversationsArray.length,
          conversations: conversationsArray.length
        });
      } catch (err) {
        console.error('❌ Erro ao carregar conversas:', err);
        setError('Erro ao carregar conversas. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    
    // Atualizar conversas a cada 30 segundos
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [user?.auth_token, user?.id]);

  const handleConversationClick = async (conversation: Conversation) => {
    if (!user?.auth_token) return;
    
    try {
      console.log('🔄 Carregando detalhes da conversa:', conversation.id);
      const detailedConversation = await getConversation(user.auth_token, conversation.id);
      setSelectedConversation(detailedConversation.payload);
      setShowConversationList(false); // Em mobile, esconde a lista
    } catch (err) {
      console.error('❌ Erro ao carregar detalhes da conversa:', err);
      setError('Erro ao carregar detalhes da conversa');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.auth_token) return;
    
    setSendingMessage(true);
    try {
      console.log('🔄 Enviando mensagem real...');
      
      // Enviar mensagem real através da API
      const response = await sendMessage(user.auth_token, selectedConversation.id, {
        content: newMessage,
        message_type: 1, // 1 = outgoing (mensagem do agente)
        private: false
      });
      
      console.log('✅ Mensagem enviada com sucesso:', response);
      
      // Criar mensagem local para atualizar a interface
      const newMessageObj: Message = {
        id: response.id || Date.now(),
        content: newMessage,
        message_type: 1,
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.name,
          type: 'agent'
        }
      };

      // Atualizar a conversa selecionada com a nova mensagem
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMessageObj]
      } : null);

      // Atualizar a lista de conversas para mostrar a última mensagem
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, last_message: { content: newMessage, created_at: new Date().toISOString() } }
          : conv
      ));

      setNewMessage('');
    } catch (err) {
      console.error('❌ Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberta';
      case 'resolved':
        return 'Resolvida';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  const handlePermissionsLoaded = (permissions: any) => {
    setUserPermissions(permissions);
    console.log('✅ Permissões do usuário carregadas:', permissions);
  };

  const handleStatsLoaded = (stats: any) => {
    setConversationStats(stats);
    console.log('✅ Estatísticas carregadas:', stats);
  };

  const handleTestAPI = async () => {
    if (!user?.auth_token) return;
    
    try {
      console.log('🧪 Iniciando teste da API de conversas...');
      const result = await testConversationsAPI(user.auth_token);
      console.log('✅ Resultado do teste:', result);
      alert('Teste concluído! Verifique o console para detalhes.');
    } catch (err) {
      console.error('❌ Erro no teste da API:', err);
      alert('Erro no teste da API. Verifique o console para detalhes.');
    }
  };

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando suas conversas...</p>
          </div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="flex h-full">
        {/* Lista de Conversas - Desktop sempre visível, Mobile condicional */}
        <div className={`${showConversationList ? 'block' : 'hidden'} sm:block w-full sm:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Botão de teste da API */}
              <button
                onClick={handleTestAPI}
                className="w-full px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                🧪 Testar API
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="m-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Estatísticas das conversas */}
            <ConversationStats onStatsLoaded={handleStatsLoaded} />

            {/* Informações sobre permissões */}
            <UserPermissionsInfo onPermissionsLoaded={handlePermissionsLoaded} />

            <div className="space-y-1 p-2">
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Nenhuma conversa disponível</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.role === 'administrator' 
                      ? 'Não há conversas ativas no momento.'
                      : 'Não há conversas disponíveis no momento.'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Contador de conversas */}
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex space-x-1">
                        {conversations.filter(c => c.status === 'open').length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            {conversations.filter(c => c.status === 'open').length} aberta{conversations.filter(c => c.status === 'open').length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {conversations.filter(c => c.status === 'pending').length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            {conversations.filter(c => c.status === 'pending').length} pendente{conversations.filter(c => c.status === 'pending').length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lista de conversas */}
                  {conversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedConversation?.id === conversation.id}
                      onClick={handleConversationClick}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Área de Chat */}
        <div className={`${!showConversationList ? 'block' : 'hidden'} sm:block flex-1 flex flex-col bg-white`}>
          {selectedConversation ? (
            <>
              {/* Header da Conversa */}
              <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Botão voltar para mobile */}
                    <button
                      onClick={() => setShowConversationList(true)}
                      className="sm:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">
                        {selectedConversation.contact.name?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedConversation.contact.name || 'Cliente'}
                      </h3>
                      <div className="flex items-center space-x-2 sm:space-x-4 text-sm text-gray-600">
                        <span className="hidden sm:inline">{selectedConversation.contact.email || 'Sem email'}</span>
                        <span>{selectedConversation.contact.phone_number || 'Sem telefone'}</span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          selectedConversation.status === 'open' ? 'bg-green-100 text-green-800' :
                          selectedConversation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {getStatusText(selectedConversation.status)}
                        </span>
                        {selectedConversation.assignee_id === user?.id && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            Atribuída a você
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {selectedConversation.messages?.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender.type === 'agent' || message.sender.type === 'administrator'}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingMessage ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
                <p className="text-gray-600">
                  Escolha uma conversa da lista para começar a responder.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  );
} 