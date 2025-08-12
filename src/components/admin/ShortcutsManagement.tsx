'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@/store/userStore';
import { 
  getCannedResponses, 
  createCannedResponse, 
  updateCannedResponse, 
  deleteCannedResponse,
  CannedResponse 
} from '@/lib/api/chatwootAPI';

export default function ShortcutsManagement() {
  const { user } = useUserStore();
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para modal de criação/edição
  const [showModal, setShowModal] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
  const [formData, setFormData] = useState({
    short_code: '',
    content: ''
  });

  // Buscar respostas rápidas
  const fetchCannedResponses = useCallback(async () => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const responses = await getCannedResponses(user.auth_token);
      setCannedResponses(responses);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar respostas rápidas');
    } finally {
      setLoading(false);
    }
  }, [user?.auth_token]);

  // Carregar dados na inicialização
  useEffect(() => {
    fetchCannedResponses();
  }, [fetchCannedResponses]);

  // Abrir modal para criar nova resposta
  const openCreateModal = () => {
    setEditingResponse(null);
    setFormData({ short_code: '', content: '' });
    setShowModal(true);
  };

  // Abrir modal para editar resposta
  const openEditModal = (response: CannedResponse) => {
    setEditingResponse(response);
    setFormData({
      short_code: response.short_code,
      content: response.content
    });
    setShowModal(true);
  };

  // Fechar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingResponse(null);
    setFormData({ short_code: '', content: '' });
    setError(null);
  };

  // Salvar resposta (criar ou atualizar)
  const handleSave = async () => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      return;
    }

    if (!formData.short_code.trim() || !formData.content.trim()) {
      setError('Código e conteúdo são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingResponse) {
        // Atualizar resposta existente
        await updateCannedResponse(user.auth_token, editingResponse.id, formData);
        setSuccess('Resposta rápida atualizada com sucesso!');
      } else {
        // Criar nova resposta
        await createCannedResponse(user.auth_token, formData);
        setSuccess('Resposta rápida criada com sucesso!');
      }

      // Recarregar lista e fechar modal
      await fetchCannedResponses();
      closeModal();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar resposta rápida');
    } finally {
      setLoading(false);
    }
  };

  // Deletar resposta
  const handleDelete = async (responseId: number) => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar esta resposta rápida?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await deleteCannedResponse(user.auth_token, responseId);
      setSuccess('Resposta rápida deletada com sucesso!');
      
      // Recarregar lista
      await fetchCannedResponses();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar resposta rápida');
    } finally {
      setLoading(false);
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Respostas Rápidas (Shortcuts)</h2>
          <p className="text-sm text-gray-600 mt-1">Gerencie as respostas rápidas para agilizar o atendimento</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Resposta Rápida
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Sucesso</h3>
              <div className="mt-2 text-sm text-green-700">{success}</div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de respostas rápidas */}
      {loading && cannedResponses.length === 0 ? (
        <div className="text-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Carregando respostas rápidas...</p>
        </div>
      ) : cannedResponses.length === 0 ? (
        <div className="text-center py-8">
          <svg className="h-12 w-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="mt-2 text-gray-600">Nenhuma resposta rápida encontrada</p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
          >
            Criar primeira resposta rápida
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cannedResponses.map((response) => (
            <div key={response.id} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">{response.short_code}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Shortcut</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{response.content}</div>
                  <div className="text-xs text-gray-500">
                    Criado em: {formatDate(response.created_at)}
                    {response.updated_at !== response.created_at && (
                      <span className="ml-4">Atualizado em: {formatDate(response.updated_at)}</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => openEditModal(response)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(response.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Deletar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de criação/edição */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingResponse ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Código do Shortcut</label>
                  <input
                    type="text"
                    value={formData.short_code}
                    onChange={(e) => setFormData({...formData, short_code: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: saudacao_inicial"
                  />
                  <p className="mt-1 text-xs text-gray-500">Código único para identificar esta resposta rápida</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Conteúdo da Resposta</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={6}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite o conteúdo da resposta rápida..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Você pode usar variáveis como {'{{agent.name}}'} e {'{{contact.name}}'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    editingResponse ? 'Atualizar' : 'Criar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 