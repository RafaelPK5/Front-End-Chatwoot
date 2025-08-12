"use client";

import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { getAutomationStats } from '../../lib/api/chatwootAPI';

interface AutomationStats {
  totalRules: number;
  activeRules: number;
  processedConversations: number;
  todayProcessed: number;
  successRate: number;
  lastExecution: string;
}

export default function AutomationStats() {
  const { user } = useUserStore();
  const [stats, setStats] = useState<AutomationStats>({
    totalRules: 0,
    activeRules: 0,
    processedConversations: 0,
    todayProcessed: 0,
    successRate: 0,
    lastExecution: 'N/A'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.auth_token) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const statsData = await getAutomationStats(user.auth_token || '');
        setStats(statsData);
      } catch (err) {
        console.error('Erro ao carregar estatísticas de automações:', err);
        setError('Erro ao carregar estatísticas. Verifique o console para mais detalhes.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.auth_token]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Estatísticas de Automações</h3>
        <p className="text-sm text-gray-600">
          Visão geral do desempenho das regras de automação
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total de Regras */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalRules}</div>
          <div className="text-sm text-gray-600">Total de Regras</div>
        </div>

        {/* Regras Ativas */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">{stats.activeRules}</div>
          <div className="text-sm text-gray-600">Regras Ativas</div>
        </div>

        {/* Conversas Processadas */}
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {stats.processedConversations > 0 ? stats.processedConversations : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Conversas Processadas</div>
        </div>

        {/* Taxa de Sucesso */}
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {stats.successRate > 0 ? `${stats.successRate}%` : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Taxa de Sucesso</div>
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-900">Processadas Hoje</div>
            <div className="text-lg font-semibold text-gray-700">
              {stats.todayProcessed > 0 ? stats.todayProcessed : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">Última Execução</div>
            <div className="text-lg font-semibold text-gray-700">
              {stats.lastExecution === 'N/A' ? 'N/A' : new Date(stats.lastExecution).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>

      {/* Status geral */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">Status Geral</div>
            <div className="text-sm text-gray-600">
              {stats.totalRules > 0 ? (
                <>
                  {stats.activeRules} de {stats.totalRules} regras ativas
                  {stats.activeRules === stats.totalRules && ' - Todas as regras estão ativas'}
                  {stats.activeRules === 0 && ' - Nenhuma regra ativa'}
                </>
              ) : (
                'Nenhuma regra configurada'
              )}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            stats.totalRules === 0 
              ? 'bg-gray-100 text-gray-800'
              : stats.activeRules === stats.totalRules
              ? 'bg-green-100 text-green-800'
              : stats.activeRules === 0
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {stats.totalRules === 0 
              ? 'Sem regras'
              : stats.activeRules === stats.totalRules
              ? 'Todas ativas'
              : stats.activeRules === 0
              ? 'Todas inativas'
              : 'Parcialmente ativo'
            }
          </div>
        </div>
      </div>
    </div>
  );
} 