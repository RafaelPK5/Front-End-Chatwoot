'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUserStore } from '../../store/userStore';
import { Conversation, Message, getConversations, getConversation, sendMessage, updateConversationStatus, assignConversation, getCannedResponses, CannedResponse } from '../../lib/api/chatwootAPI';
import { getUserSpecificTeams, getConversationsByTeam } from '../../lib/api/chatwootAPI';
import ConversationItem from './ConversationItem';
import MessageBubble from './MessageBubble';
import SystemMessageTag from './SystemMessageTag';
import ConversationActions from './ConversationActions';
import ConversationLabels from './ConversationLabels';
import ContactManagementModal from './ContactManagementModal';
import ConnectionStatus from './ConnectionStatus';
import { useRealTimeMessages } from '../../hooks/useRealTimeMessages';
import { useWebSocketMessages } from '../../hooks/useWebSocketMessages';

export default function AgentConversations() {
  const { user } = useUserStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assigned' | 'team'>('assigned');
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [teamConversations, setTeamConversations] = useState<Conversation[]>([]);
  const [loadingTeamConversations, setLoadingTeamConversations] = useState(false);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [filteredShortcuts, setFilteredShortcuts] = useState<CannedResponse[]>([]);
  const [selectedShortcutIndex, setSelectedShortcutIndex] = useState(0);
  const [shortcutQuery, setShortcutQuery] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hook para mensagens em tempo real
  const { messages: realTimeMessages, addMessage } = useRealTimeMessages({
    conversationId: selectedConversation?.id,
    enabled: !!selectedConversation?.id
  });
  const { isConnected } = useWebSocketMessages({ conversationId: selectedConversation?.id, enabled: !!selectedConversation?.id });

  // Função para verificar se uma mensagem é do sistema
  const isSystemMessage = (message: Message): boolean => {
    return message.message_type === 2 || message.content_type === 'text' && message.content.startsWith('**');
  };

  // Função para scroll automático para o final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Efeito para scroll automático quando novas mensagens chegam
  useEffect(() => {
    scrollToBottom();
  }, [messages, realTimeMessages]);

  // Efeito para lidar com novas mensagens em tempo real
  useEffect(() => {
    const handleNewMessages = (event: CustomEvent) => {
      const { conversationId, messages: newMessages } = event.detail;
      
      if (conversationId === selectedConversation?.id) {
        // Filtrar apenas mensagens que não são do sistema
        const nonSystemMessages = newMessages.filter((msg: Message) => !isSystemMessage(msg));
        
        if (nonSystemMessages.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const uniqueNewMessages = nonSystemMessages.filter((msg: Message) => !existingIds.has(msg.id));
            return [...prev, ...uniqueNewMessages];
          });

          // Atualizar a lista de conversas para mostrar a última mensagem
          if (newMessages.length > 0) {
            setConversations(prev => prev.map(conv => 
              conv.id === conversationId 
                ? { 
                    ...conv, 
                    last_message: { 
                      content: newMessages[newMessages.length - 1].content, 
                      created_at: newMessages[newMessages.length - 1].created_at 
                    } 
                  }
                : conv
            ));
          }
        }
      }
    };

    window.addEventListener('newMessages', handleNewMessages as EventListener);
    
    return () => {
      window.removeEventListener('newMessages', handleNewMessages as EventListener);
    };
  }, [selectedConversation?.id, addMessage, realTimeMessages]);

  const getContactDisplayInfo = (conversation: Conversation | null) => {
    if (!conversation) return { name: 'Selecione uma conversa', status: 'offline' };
    
    const contact = conversation.contact;
    if (!contact) return { name: 'Contato desconhecido', status: 'offline' };
    
    return {
      name: contact.name || contact.email || contact.phone_number || 'Contato sem nome',
      status: conversation.contact_last_seen_at ? 'online' : 'offline'
    };
  };

  const fetchConversations = async () => {
    if (!user?.auth_token) return;

    try {
      setLoading(true);
      const conversationsData = await getConversations(user.auth_token);
      
      // Filtrar apenas conversas atribuídas ao agente logado
      const assignedConversations = conversationsData.filter((conversation: Conversation) => {
        const isAssignedToCurrentAgent = conversation.agent?.id === user.id || conversation.assignee_id === user.id;
        console.log(`🔍 Conversa ${conversation.id}: agent_id = ${conversation.agent?.id}, assignee_id = ${conversation.assignee_id}, user_id = ${user.id}, atribuída ao agente = ${isAssignedToCurrentAgent}`);
        return isAssignedToCurrentAgent;
      });
      
      console.log(`📊 Conversas atribuídas ao agente ${user.id}: ${assignedConversations.length} de ${conversationsData.length} total`);
      setConversations(assignedConversations);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar conversas:', err);
      setError('Erro ao carregar conversas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar times do usuário
  const fetchUserTeams = async () => {
    if (!user?.auth_token || !user?.id) return;

    try {
      const teams = await getUserSpecificTeams(user.auth_token, user.id);
      setUserTeams(teams);
    } catch (err: any) {
      console.error('Erro ao buscar times do usuário:', err);
    }
  };

  // Função para buscar conversas do time
  const fetchTeamConversations = async () => {
    if (!user?.auth_token || userTeams.length === 0) return;

    try {
      setLoadingTeamConversations(true);
      
      // Buscar conversas de todos os times do usuário em uma única requisição
      const allTeamConversations: Conversation[] = [];
      
      for (const team of userTeams) {
        try {
          console.log(`🔍 Buscando conversas do time: ${team.name} (ID: ${team.id})`);
          
          // Usar o team_id específico na query - CORRIGIDO
          const teamConversationsData = await getConversationsByTeam(user.auth_token, team.id, 'open');
          const teamConversations = teamConversationsData.conversations || [];
          
          console.log(`📊 Encontradas ${teamConversations.length} conversas não atribuídas no time ${team.name}`);
          
          // Adicionar conversas deste time
          allTeamConversations.push(...teamConversations);
        } catch (err) {
          console.error(`Erro ao buscar conversas do time ${team.name}:`, err);
        }
      }
      
      // Remover duplicatas baseado no ID da conversa
      const uniqueConversations = allTeamConversations.filter((conv, index, self) => 
        index === self.findIndex(c => c.id === conv.id)
      );
      
      console.log(`📊 Total de conversas únicas do time: ${uniqueConversations.length}`);
      setTeamConversations(uniqueConversations);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar conversas do time:', err);
      setError('Erro ao carregar conversas do time. Tente novamente.');
    } finally {
      setLoadingTeamConversations(false);
    }
  };

  const handleConversationClick = async (conversation: Conversation) => {
    if (!user?.auth_token) return;

    try {
      setSelectedConversation(conversation);
      setMessages([]);
      setNewMessage('');
      setShowShortcuts(false);
      
      // Buscar mensagens da conversa
      const conversationData = await getConversation(user.auth_token, conversation.id);
      const conversationMessages = conversationData.messages || [];
      
      // Filtrar apenas mensagens que não são do sistema
      const nonSystemMessages = conversationMessages.filter((msg: Message) => !isSystemMessage(msg));
      
      setMessages(nonSystemMessages);
      
      // Scroll para o final após carregar as mensagens
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error('Erro ao carregar conversa:', err);
      setError('Erro ao carregar conversa. Tente novamente.');
    }
  };

  // Função para atribuir automaticamente uma conversa
  const autoAssignConversation = async (conversationId: number) => {
    if (!user?.auth_token || !user?.id) return;

    try {
      console.log(`🤖 Atribuindo conversa ${conversationId} automaticamente ao agente ${user.id}`);
      await assignConversation(user.auth_token, conversationId, user.id);
      
      // Atualizar a conversa localmente
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, assignee_id: user.id, agent: { id: user.id, name: user.name, email: user.email } }
          : conv
      ));
      
      // Se a conversa selecionada foi atribuída, atualizar também
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { 
          ...prev, 
          assignee_id: user.id, 
          agent: { id: user.id, name: user.name, email: user.email } 
        } : null);
      }
      
      console.log(`✅ Conversa ${conversationId} atribuída com sucesso`);
    } catch (err) {
      console.error(`❌ Erro ao atribuir conversa ${conversationId}:`, err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.auth_token) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');

    try {
      // Criar objeto de mensagem temporário para exibição imediata
      const newMessageObj: Message = {
        id: Date.now(), // ID temporário
        conversation_id: selectedConversation.id,
        message_type: 1, // outgoing
        content: messageToSend,
        content_type: 'text',
        private: false,
        source: 'web',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.name,
          email: user.email,
          type: 'agent'
        }
      };

      // Adicionar mensagem localmente
      addMessage(newMessageObj);

      // Atualizar a lista de conversas para mostrar a última mensagem
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, last_message: { content: messageToSend, created_at: new Date().toISOString() } }
          : conv
      ));

      // Enviar mensagem para o servidor
      await sendMessage(user.auth_token, selectedConversation.id, { content: messageToSend });
      
      setNewMessage('');
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem. Tente novamente.');
    }
  };

  // Função para atualizar status da conversa
  const handleStatusChange = async (conversationId: number, newStatus: string) => {
    if (!user?.auth_token) return;

    try {
      // Atribuir automaticamente a conversa se ela não estiver atribuída ao agente
      const conversation = conversations.find(c => c.id === conversationId) || 
                          teamConversations.find(c => c.id === conversationId);
      
      if (conversation && (!conversation.agent || conversation.agent.id !== user.id)) {
        await autoAssignConversation(conversationId);
      }

      await updateConversationStatus(user.auth_token, conversationId, newStatus as 'open' | 'resolved' | 'pending');
      
      // Atualizar a conversa localmente
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, status: newStatus as 'open' | 'resolved' | 'pending' }
          : conv
      ));

      // Se a conversa selecionada foi atualizada, atualizar também
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, status: newStatus as 'open' | 'resolved' | 'pending' } : null);
      }
    } catch (err) {
      console.error('Erro ao atualizar status da conversa:', err);
      setError('Erro ao atualizar status da conversa. Tente novamente.');
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchUserTeams();
    fetchCannedResponses(); // Carregar canned responses
    
    // Remover o intervalo de recarregamento automático - não é necessário com mensagens em tempo real
    // const interval = setInterval(fetchConversations, 30000);
    // return () => clearInterval(interval);
  }, [user?.auth_token]);

  // Efeito para buscar conversas do time quando os times são carregados OU quando a aba muda para 'team'
  useEffect(() => {
    if (activeTab === 'team' && userTeams.length > 0) {
      console.log('🔄 Aba Time ativada, buscando conversas...');
      fetchTeamConversations();
    }
  }, [activeTab, userTeams]);

  // Função para buscar canned responses
  const fetchCannedResponses = async () => {
    if (!user?.auth_token) return;

    try {
      const responses = await getCannedResponses(user.auth_token);
      setCannedResponses(responses);
      console.log('✅ Canned responses carregadas:', responses.length);
    } catch (error) {
      console.error('❌ Erro ao carregar canned responses:', error);
    }
  };

  // Função para detectar e processar shortcuts
  const handleShortcutDetection = (text: string) => {
    if (text.startsWith('/')) {
      const query = text.slice(1).toLowerCase(); // Remove o '/' e converte para minúsculas
      setShortcutQuery(query);
      
      if (query.length > 0) {
        // Filtrar canned responses que correspondem à query
        const filtered = cannedResponses.filter(response => 
          response.short_code.toLowerCase().includes(query) || 
          response.content.toLowerCase().includes(query)
        );
        
        setFilteredShortcuts(filtered);
        setShowShortcuts(filtered.length > 0);
        setSelectedShortcutIndex(0);
      } else {
        setShowShortcuts(false);
      }
    } else {
      setShowShortcuts(false);
    }
  };

  // Função para substituir variáveis no conteúdo
  const replaceVariables = (content: string, conversation: Conversation | null, user: any) => {
    if (!conversation || !user) return content;
    
    return content
      .replace(/\{contact\.name\}/g, conversation.contact?.name || 'Cliente')
      .replace(/\{contact\.email\}/g, conversation.contact?.email || '')
      .replace(/\{agent\.name\}/g, user.name || 'Agente')
      .replace(/\{conversation\.id\}/g, conversation.id.toString());
  };

  // Função para aplicar shortcut
  const applyShortcut = (shortcut: CannedResponse) => {
    if (!selectedConversation) return;
    
    const processedContent = replaceVariables(shortcut.content, selectedConversation, user);
    setNewMessage(processedContent);
    setShowShortcuts(false);
    setFilteredShortcuts([]);
    setSelectedShortcutIndex(0);
    
    // Focar no input após aplicar o shortcut
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Função para navegar pelos shortcuts com teclado
  const handleShortcutNavigation = (e: React.KeyboardEvent) => {
    if (!showShortcuts || filteredShortcuts.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedShortcutIndex(prev => 
          prev < filteredShortcuts.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedShortcutIndex(prev => 
          prev > 0 ? prev - 1 : filteredShortcuts.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredShortcuts[selectedShortcutIndex]) {
          applyShortcut(filteredShortcuts[selectedShortcutIndex]);
        }
        break;
      case 'Escape':
        setShowShortcuts(false);
        setFilteredShortcuts([]);
        setSelectedShortcutIndex(0);
        break;
    }
  };

  // Função para lidar com mudanças no input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    handleShortcutDetection(value);
  };

  // Função para lidar com teclas pressionadas no input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showShortcuts) {
      handleShortcutNavigation(e);
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentConversations = activeTab === 'assigned' ? conversations : teamConversations;
  const currentLoading = activeTab === 'assigned' ? loading : loadingTeamConversations;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar com lista de conversas */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Conversas</h1>
            <ConnectionStatus isConnected={isConnected} />
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'assigned'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Atribuídas ({conversations.length})
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'team'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Time ({teamConversations.length})
            </button>
          </div>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto">
          {currentLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">
              <p>{error}</p>
              <button
                onClick={fetchConversations}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Tentar novamente
              </button>
            </div>
          ) : currentConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>Nenhuma conversa encontrada.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {currentConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation?.id === conversation.id}
                  onClick={handleConversationClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Área principal da conversa */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Header da conversa */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {getContactDisplayInfo(selectedConversation).name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {getContactDisplayInfo(selectedConversation).name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.contact?.email || selectedConversation.contact?.phone_number || 'Sem contato'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <ConversationActions
                    conversation={selectedConversation}
                    onStatusChange={handleStatusChange}
                  />
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Labels da conversa */}
              <ConversationLabels conversationId={selectedConversation.id} />
            </div>

            {/* Área de mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>Nenhuma mensagem ainda.</p>
                  <p className="text-sm">Inicie a conversa enviando uma mensagem.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex flex-col space-y-2">
                    {isSystemMessage(message) ? (
                      <SystemMessageTag message={message.content} />
                    ) : (
                      <MessageBubble
                        message={message}
                        isOwnMessage={message.message_type === 1}
                      />
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Área de input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Shortcuts */}
              {showShortcuts && filteredShortcuts.length > 0 && (
                <div className="mb-2 bg-gray-50 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {filteredShortcuts.map((shortcut, index) => (
                    <div
                      key={shortcut.id}
                      onClick={() => applyShortcut(shortcut)}
                      className={`p-2 cursor-pointer hover:bg-gray-100 ${
                        index === selectedShortcutIndex ? 'bg-blue-100' : ''
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900">
                        /{shortcut.short_code}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {shortcut.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Digite sua mensagem... (use / para shortcuts)"
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conversa selecionada</h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecione uma conversa da lista para começar.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de gerenciamento de contato */}
      {showContactModal && selectedConversation && (
        <ContactManagementModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </div>
  );
}