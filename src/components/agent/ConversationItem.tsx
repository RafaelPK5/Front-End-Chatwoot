'use client';

import { Conversation } from '../../lib/api/chatwootAPI';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: (conversation: Conversation) => void;
}

export default function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500';
      case 'resolved':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
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

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInHours * 60);
        return diffInMinutes === 0 ? 'Agora' : `${diffInMinutes}m`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h`;
      } else {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Verificações de segurança para evitar erros
  const contactName = conversation.contact?.name || 'Cliente';
  const contactInitial = contactName.charAt(0)?.toUpperCase() || 'C';
  const phoneNumber = conversation.contact?.phone_number || '';
  
  // Usar last_message se disponível, senão usar uma mensagem padrão
  const lastMessageContent = conversation.last_message?.content || 'Nenhuma mensagem';
  const hasUnreadMessages = conversation.status === 'open' && lastMessageContent !== 'Nenhuma mensagem';

  return (
    <div
      onClick={() => onClick(conversation)}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 relative">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
              {contactInitial}
            </span>
          </div>
          {/* Indicador de status */}
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(conversation.status)}`}></div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {contactName}
            </h4>
            <div className="flex items-center space-x-2">
              {hasUnreadMessages && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(conversation.updated_at)}
              </span>
            </div>
          </div>
          
          <p className={`text-xs mt-1 truncate ${
            hasUnreadMessages ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'
          }`}>
            {lastMessageContent}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              conversation.status === 'open' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
              conversation.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
              'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
            }`}>
              {getStatusText(conversation.status)}
            </span>
            
            {phoneNumber && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.493.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {phoneNumber}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 