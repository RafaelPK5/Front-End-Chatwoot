'use client';

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';

interface Settings {
  chatwoot: {
    apiUrl: string;
    accountId: string;
  };
  evolution: {
    apiUrl: string;
    apiKey: string;
  };
  n8n: {
    webhookUrl: string;
  };
  general: {
    appName: string;
    environment: string;
  };
}

export default function SettingsManagement() {
  const { user } = useUserStore();
  const [settings, setSettings] = useState<Settings>({
    chatwoot: {
      apiUrl: process.env.NEXT_PUBLIC_CHATWOOT_API_URL || 'http://localhost:3000',
      accountId: '1'
    },
    evolution: {
      apiUrl: process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'http://212.85.17.18:8080',
      apiKey: process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || 'Shilinkert_KeyAdmin'
    },
    n8n: {
      webhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://212.85.17.18:5678/webhook/get-qrcode'
    },
    general: {
      appName: 'Chatwoot Frontend',
      environment: process.env.NODE_ENV || 'development'
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'chatwoot' | 'evolution' | 'n8n'>('general');

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Simular salvamento das configurações
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Configurações salvas com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const testChatwootConnection = async () => {
    if (!user?.auth_token) {
      setError('Token de autenticação não encontrado');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${settings.chatwoot.apiUrl}/api/chatwoot/api/v1/accounts/${settings.chatwoot.accountId}/agents`, {
        headers: { 'api_access_token': user.auth_token }
      });

      if (response.ok) {
        setSuccess('Conexão com Chatwoot estabelecida com sucesso!');
      } else {
        setError(`Erro na conexão: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      setError(`Erro ao testar conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testEvolutionConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${settings.evolution.apiUrl}/instance/fetchInstances`, {
        headers: { 'apikey': settings.evolution.apiKey }
      });

      if (response.ok) {
        setSuccess('Conexão com Evolution API estabelecida com sucesso!');
      } else {
        setError(`Erro na conexão: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      setError(`Erro ao testar conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testN8NConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(settings.n8n.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });

      if (response.ok) {
        setSuccess('Conexão com N8N estabelecida com sucesso!');
      } else {
        setError(`Erro na conexão: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      setError(`Erro ao testar conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">Gerencie as configurações do sistema</p>
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

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Geral
            </button>
            <button
              onClick={() => setActiveTab('chatwoot')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'chatwoot'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chatwoot
            </button>
            <button
              onClick={() => setActiveTab('evolution')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'evolution'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Evolution API
            </button>
            <button
              onClick={() => setActiveTab('n8n')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'n8n'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              N8N
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'general' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Configurações Gerais</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome da Aplicação</label>
              <input
                type="text"
                value={settings.general.appName}
                onChange={(e) => setSettings({...settings, general: {...settings.general, appName: e.target.value}})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Ambiente</label>
              <select
                value={settings.general.environment}
                onChange={(e) => setSettings({...settings, general: {...settings.general, environment: e.target.value}})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="development">Desenvolvimento</option>
                <option value="staging">Homologação</option>
                <option value="production">Produção</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chatwoot' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Configurações do Chatwoot</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">URL da API</label>
              <input
                type="url"
                value={settings.chatwoot.apiUrl}
                onChange={(e) => setSettings({...settings, chatwoot: {...settings.chatwoot, apiUrl: e.target.value}})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="http://localhost:3000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">ID da Conta</label>
              <input
                type="text"
                value={settings.chatwoot.accountId}
                onChange={(e) => setSettings({...settings, chatwoot: {...settings.chatwoot, accountId: e.target.value}})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="1"
              />
            </div>
            
            <div className="pt-4">
              <button
                onClick={testChatwootConnection}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Testar Conexão
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evolution' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Configurações da Evolution API</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">URL da API</label>
              <input
                type="url"
                value={settings.evolution.apiUrl}
                onChange={(e) => setSettings({...settings, evolution: {...settings.evolution, apiUrl: e.target.value}})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="http://212.85.17.18:8080"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">API Key</label>
              <input
                type="password"
                value={settings.evolution.apiKey}
                onChange={(e) => setSettings({...settings, evolution: {...settings.evolution, apiKey: e.target.value}})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Sua API Key"
              />
            </div>
            
            <div className="pt-4">
              <button
                onClick={testEvolutionConnection}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Testar Conexão
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'n8n' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Configurações do N8N</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">URL do Webhook</label>
              <input
                type="url"
                value={settings.n8n.webhookUrl}
                onChange={(e) => setSettings({...settings, n8n: {...settings.n8n, webhookUrl: e.target.value}})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="http://212.85.17.18:5678/webhook/get-qrcode"
              />
            </div>
            
            <div className="pt-4">
              <button
                onClick={testN8NConnection}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Testar Conexão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão Salvar */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Salvar Configurações
            </>
          )}
        </button>
      </div>
    </div>
  );
} 