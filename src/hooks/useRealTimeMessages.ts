'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { getMessages, Message } from '../lib/api/chatwootAPI';

interface UseRealTimeMessagesProps {
  conversationId?: number;
  enabled?: boolean;
  pollingInterval?: number; // em milissegundos
}

interface RealTimeMessage extends Message {
  conversation_id: number;
}

export function useRealTimeMessages({ 
  conversationId, 
  enabled = true, 
  pollingInterval = 3000 
}: UseRealTimeMessagesProps) {
  const { user } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Função para buscar mensagens
  const fetchMessages = useCallback(async () => {
    if (!user?.auth_token || !conversationId) return;

    try {
      const response = await getMessages(user.auth_token, conversationId);
      const newMessages = response.payload || [];
      
      // Ordenar mensagens por data de criação
      const sortedMessages = newMessages.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      });

      // Verificar se há novas mensagens
      if (sortedMessages.length > 0) {
        const latestMessageId = sortedMessages[sortedMessages.length - 1].id;
        
        if (lastMessageId === null || latestMessageId > lastMessageId) {
          // Filtrar apenas mensagens que realmente são novas
          const trulyNewMessages = lastMessageId === null 
            ? sortedMessages 
            : sortedMessages.filter((msg: Message) => msg.id > lastMessageId);
          
          if (trulyNewMessages.length > 0) {
            setMessages(sortedMessages);
            setLastMessageId(latestMessageId);
            
            // Emitir evento apenas para mensagens realmente novas
            window.dispatchEvent(new CustomEvent('newMessages', {
              detail: {
                conversationId,
                messages: trulyNewMessages
              }
            }));
          }
        }
      }

      setError(null);
    } catch (err: any) {
      console.error('❌ Erro ao buscar mensagens em tempo real:', err);
      setError(err.message || 'Erro ao buscar mensagens');
    }
  }, [user?.auth_token, conversationId, lastMessageId]);

  // Função para iniciar polling
  const startPolling = useCallback(() => {
    if (!enabled || !conversationId) return;

    // Limpar polling anterior
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Buscar mensagens imediatamente
    fetchMessages();

    // Iniciar polling
    pollingRef.current = setInterval(fetchMessages, pollingInterval);
    setIsConnected(true);
  }, [enabled, conversationId, fetchMessages, pollingInterval]);

  // Função para parar polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Função para adicionar mensagem localmente
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Verificar se a mensagem já existe para evitar duplicação
      const messageExists = prev.some(existingMessage => existingMessage.id === message.id);
      if (messageExists) {
        return prev;
      }
      
      const updatedMessages = [...prev, message];
      // Ordenar por data de criação
      return updatedMessages.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      });
    });
    setLastMessageId(message.id);
  }, []);

  // Função para limpar mensagens
  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastMessageId(null);
  }, []);

  // Efeito para gerenciar polling
  useEffect(() => {
    if (enabled && conversationId && user?.auth_token) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, conversationId, user?.auth_token, startPolling, stopPolling]);

  // Efeito para limpar ao desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    messages,
    isConnected,
    error,
    addMessage,
    clearMessages,
    refresh: fetchMessages
  };
}
