'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import { Bell, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useDashboardAlerts } from '../admin/useDashboardAlerts';
import ThemeToggle from '../ui/ThemeToggle';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const { alerts, loading } = useDashboardAlerts();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Botão menu mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Título da página */}
            <div className="flex-1 lg:ml-0 ml-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo-communica.png" 
                  alt="Communica Logo" 
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Dashboard Administrativo
                </h1>
              </div>
            </div>

            {/* Ações do header */}
            <div className="flex items-center space-x-4 relative">
              {/* Toggle de Tema */}
              <ThemeToggle />
              
              {/* Notificações */}
              <div className="relative">
                <button
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                  onClick={() => setShowAlerts((v) => !v)}
                  aria-label="Notificações"
                >
                  <Bell className="w-6 h-6" />
                  {alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {alerts.length}
                    </span>
                  )}
                </button>
                {/* Dropdown de alertas */}
                {showAlerts && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">Alertas do Sistema</span>
                      <button className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onClick={() => setShowAlerts(false)}>Fechar</button>
                    </div>
                    {loading ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">Carregando...</div>
                    ) : alerts.length === 0 ? (
                      <div className="p-4 text-center text-green-600 flex flex-col items-center">
                        <CheckCircle className="h-8 w-8 mb-2" />
                        Nenhum alerta ativo no momento
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {alerts.map(alert => (
                          <li key={alert.id} className="flex items-start space-x-3 p-3">
                            {getAlertIcon(alert.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-white text-sm">{alert.title}</span>
                                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                  alert.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                  {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{alert.message}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{alert.timestamp.toLocaleTimeString('pt-BR')}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Perfil */}
              <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 