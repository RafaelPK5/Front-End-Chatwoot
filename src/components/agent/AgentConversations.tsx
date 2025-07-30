'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getConversations, getConversation } from '../../lib/api/chatwootAPI';

interface Conversation {
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
  const { user, logout } = useUserStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.auth_token) return;
      
      try {
        setLoading(true);
        const data = await getConversations(user.auth_token);
        setConversations(data.payload || []);
      } catch (err) {
        setError('Erro ao carregar conversas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user?.auth_token]);

  const handleConversationClick = async (conversation: Conversation) => {
    if (!user?.auth_token) return;
    
    try {
      const detailedConversation = await getConversation(user.auth_token, conversation.id);
      setSelectedConversation(detailedConversation.payload);
    } catch (err) {
      console.error('Erro ao carregar detalhes da conversa:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Conversas</h1>
              <p className="text-gray-600">Bem-vindo, {user?.name}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Conversas */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Conversas ({conversations.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationClick(conversation)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedConversation?.id === conversation.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.contact.name || 'Cliente'}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {conversation.contact.email || conversation.contact.phone_number || 'Sem contato'}
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(conversation.status)}`}>
                          {getStatusText(conversation.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(conversation.updated_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes da Conversa */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Conversa com {selectedConversation.contact.name || 'Cliente'}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedConversation.status)}`}>
                      {getStatusText(selectedConversation.status)}
                    </span>
                  </div>

                  {/* Informações do Contato */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Informações do Contato</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Nome:</span>
                        <span className="ml-2 text-gray-900">{selectedConversation.contact.name || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2 text-gray-900">{selectedConversation.contact.email || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Telefone:</span>
                        <span className="ml-2 text-gray-900">{selectedConversation.contact.phone_number || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Criada em:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(selectedConversation.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Mensagens</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedConversation.messages?.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.sender.type === 'agent' || message.sender.type === 'administrator'
                              ? 'bg-blue-50 ml-8'
                              : 'bg-gray-50 mr-8'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              {message.sender.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conversa selecionada</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Selecione uma conversa da lista para ver os detalhes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 