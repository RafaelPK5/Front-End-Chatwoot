'use client';

import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { Label, getLabels, addLabelsToConversation, removeLabelsFromConversation, getConversationLabels } from '../../lib/api/chatwootAPI';

interface ConversationLabelsProps {
  conversationId: number;
  onLabelsChange?: (labels: Label[]) => void;
}

export default function ConversationLabels({ conversationId, onLabelsChange }: ConversationLabelsProps) {
  const { user } = useUserStore();
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [conversationLabels, setConversationLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLabelSelector, setShowLabelSelector] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  // Carregar labels disponíveis e da conversa
  const loadLabels = async () => {
    if (!conversationId || !user?.auth_token) return;

    try {
      setLoading(true);
      
      // Carregar labels disponíveis da conta
      const labels = await getLabels(user.auth_token);
      setAvailableLabels(labels);
      
      // Carregar labels da conversa
      const convLabels = await getConversationLabels(user.auth_token, conversationId);
      setConversationLabels(convLabels);
      
      console.log('✅ Labels carregadas:', { 
        available: labels.length, 
        conversation: convLabels.length,
        conversationLabels: convLabels,
        availableLabels: labels
      });
    } catch (error) {
      console.error('❌ Erro ao carregar labels:', error);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar labels à conversa
  const handleAddLabels = async () => {
    if (!conversationId || !user?.auth_token || selectedLabels.length === 0) return;

    try {
      setLoading(true);
      console.log('🔄 Adicionando labels:', selectedLabels);
      
      // Garantir que estamos enviando os nomes exatos das labels
      const labelNames = selectedLabels.map(labelTitle => {
        // Encontrar a label completa para garantir que temos o nome correto
        const fullLabel = availableLabels.find(label => label.title === labelTitle);
        return fullLabel ? fullLabel.title : labelTitle;
      });
      
      console.log('🎯 Labels para enviar:', labelNames);
      
      await addLabelsToConversation(user.auth_token, conversationId, labelNames);
      
      // Recarregar labels da conversa
      const updatedLabels = await getConversationLabels(user.auth_token, conversationId);
      console.log('✅ Labels atualizadas após adição:', updatedLabels);
      
      setConversationLabels(updatedLabels);
      
      // Limpar seleção
      setSelectedLabels([]);
      setShowLabelSelector(false);
      
      // Notificar mudança
      if (onLabelsChange) {
        onLabelsChange(updatedLabels);
      }
      
      console.log('✅ Labels adicionadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar labels:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remover label da conversa
  const handleRemoveLabel = async (labelTitle: string) => {
    if (!conversationId || !user?.auth_token) return;

    try {
      setLoading(true);
      console.log('🔄 Removendo label:', labelTitle);
      
      await removeLabelsFromConversation(user.auth_token, conversationId, [labelTitle]);
      
      // Recarregar labels da conversa
      const updatedLabels = await getConversationLabels(user.auth_token, conversationId);
      setConversationLabels(updatedLabels);
      
      // Notificar mudança
      if (onLabelsChange) {
        onLabelsChange(updatedLabels);
      }
      
      console.log('✅ Label removida com sucesso');
    } catch (error) {
      console.error('❌ Erro ao remover label:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar labels quando a conversa mudar
  useEffect(() => {
    loadLabels();
  }, [conversationId, user?.auth_token]);

  // Verificar se label já está aplicada
  const isLabelApplied = (labelTitle: string) => {
    return conversationLabels.some(label => label.title === labelTitle);
  };

  // Toggle seleção de label
  const toggleLabelSelection = (labelTitle: string) => {
    setSelectedLabels(prev => {
      if (prev.includes(labelTitle)) {
        return prev.filter(l => l !== labelTitle);
      } else {
        return [...prev, labelTitle];
      }
    });
  };

  return (
    <div className="relative">
      {/* Labels atuais da conversa */}
      <div className="flex flex-wrap gap-2 mb-2">
        {conversationLabels && conversationLabels.length > 0 ? (
          conversationLabels.map((label) => (
            <span
              key={`conversation-label-${label.id || label.title}-${label.title}`}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              style={{
                backgroundColor: label.color ? `${label.color}20` : undefined,
                color: label.color || undefined,
                border: label.color ? `1px solid ${label.color}` : undefined
              }}
            >
              {label.title}
              <button
                onClick={() => handleRemoveLabel(label.title)}
                disabled={loading}
                className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Nenhuma label aplicada
          </span>
        )}
      </div>

      {/* Botão para adicionar labels */}
      <button
        onClick={() => setShowLabelSelector(!showLabelSelector)}
        disabled={loading}
        className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Adicionar Labels
      </button>

      {/* Seletor de labels */}
      {showLabelSelector && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Selecionar Labels</h3>
          </div>
          
          <div className="p-2">
            {availableLabels.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 p-2">Nenhuma label disponível</p>
            ) : (
              availableLabels.map((label) => (
                <label
                  key={`available-label-${label.id || label.title}-${label.title}`}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    isLabelApplied(label.title) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedLabels.includes(label.title)}
                    onChange={() => !isLabelApplied(label.title) && toggleLabelSelection(label.title)}
                    disabled={isLabelApplied(label.title) || loading}
                    className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: label.color || '#8b5cf6' }}
                  ></span>
                  <span className="text-sm text-gray-900 dark:text-white">{label.title}</span>
                  {isLabelApplied(label.title) && (
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Aplicada</span>
                  )}
                </label>
              ))
            )}
          </div>
          
          {selectedLabels.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleAddLabels}
                disabled={loading}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {loading ? 'Adicionando...' : `Adicionar ${selectedLabels.length} label(s)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
