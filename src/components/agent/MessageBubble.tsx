'use client';

import React from 'react';

interface Message {
  id: number;
  content: string;
  message_type: number; // 0 = recebida (cliente), 1 = enviada (agente)
  created_at: string;
  sender?: {
    name?: string;
    type?: string;
  } | null;
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const senderName = message.sender?.name || 'Usuário';
  const messageContent = message.content || 'Mensagem vazia';
  const messageTime = message.created_at || new Date().toISOString();

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwnMessage 
          ? 'bg-green-600 text-white rounded-br-sm shadow-sm' 
          : 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-bl-sm'
      }`}>
        {/* Nome do remetente (apenas para mensagens de outros) */}
        {!isOwnMessage && (
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {senderName}
          </div>
        )}
        
        {/* Conteúdo da mensagem */}
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {messageContent}
        </div>
        
        {/* Horário da mensagem */}
        <div className={`text-xs mt-1 ${
          isOwnMessage 
            ? 'text-green-100' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {formatTime(messageTime)}
        </div>
      </div>
    </div>
  );
} 