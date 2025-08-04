'use client';

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

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwnMessage
          ? 'bg-indigo-600 text-white'
          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
      }`}>
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs font-medium opacity-75">
            {message.sender.name}
          </span>
          <span className={`text-xs ${isOwnMessage ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {formatTime(message.created_at)}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        
        {/* Indicador de status da mensagem (para mensagens próprias) */}
        {isOwnMessage && (
          <div className="flex justify-end items-center mt-1">
            <svg className="w-3 h-3 text-indigo-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
} 