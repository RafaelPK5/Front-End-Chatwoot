'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { Message } from '../lib/api/chatwootAPI';

interface UseWebSocketMessagesProps {
  conversationId?: number;
  enabled?: boolean;
  wsUrl?: string;
}

export function useWebSocketMessages({ 
  conversationId, 
  enabled = true,
  wsUrl = 'wss://212.85.17.18:8081/cable' // URL do WebSocket do Chatwoot
}: UseWebSocketMessagesProps) {
  const { user } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Função para conectar ao WebSocket
  const connectWebSocket = useCallback(() => {
    if (!enabled || !conversationId || !user?.auth_token) return;

    try {
      // Fechar conexão existente
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Criar nova conexão WebSocket
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket conectado');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Enviar mensagem de autenticação
        const authMessage = {
          command: 'subscribe',
          identifier: JSON.stringify({
            channel: 'ConversationChannel',
            conversation_id: conversationId,
            user_token: user.auth_token
          })
        };
        ws.send(JSON.stringify(authMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Verificar se é uma mensagem de conversa
          if (data.message && data.message.type === 'message') {
            const newMessage: Message = {
              id: data.message.id,
              content: data.message.content,
              message_type: data.message.message_type,
              content_type: data.message.content_type || 'text',
              created_at: data.message.created_at,
              sender: data.message.sender
            };

            setMessages(prev => {
              const updatedMessages = [...prev, newMessage];
              // Ordenar por data de criação
              return updatedMessages.sort((a, b) => {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateA - dateB;
              });
            });

            // Emitir evento customizado para novas mensagens
            window.dispatchEvent(new CustomEvent('newMessages', {
              detail: {
                conversationId,
                messages: [newMessage]
              }
            }));
          }
        } catch (err) {
          console.error('❌ Erro ao processar mensagem WebSocket:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
        setError('Erro na conexão WebSocket');
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        setIsConnected(false);
        
        // Tentar reconectar se não foi fechado intencionalmente
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Tentativa de reconexão ${reconnectAttempts.current}/${maxReconnectAttempts}`);
            connectWebSocket();
          }, delay);
        }
      };

    } catch (err: any) {
      console.error('❌ Erro ao conectar WebSocket:', err);
      setError(err.message || 'Erro ao conectar WebSocket');
    }
  }, [enabled, conversationId, user?.auth_token, wsUrl]);

  // Função para desconectar
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Desconexão intencional');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  // Função para adicionar mensagem localmente
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      const updatedMessages = [...prev, message];
      return updatedMessages.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      });
    });
  }, []);

  // Função para limpar mensagens
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Efeito para gerenciar conexão
  useEffect(() => {
    if (enabled && conversationId && user?.auth_token) {
      connectWebSocket();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, conversationId, user?.auth_token, connectWebSocket, disconnect]);

  // Efeito para limpar ao desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    isConnected,
    error,
    addMessage,
    clearMessages,
    disconnect,
    connect: connectWebSocket
  };
}
