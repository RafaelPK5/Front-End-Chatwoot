'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../store/userStore';
import LoginForm from './ui/LoginForm';
import AdminLayout from './layout/AdminLayout';
import AgentConversations from './agent/AgentConversations';

export default function RoleBasedRouter() {
  const { user, isLoggedIn, isLoading } = useUserStore();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isLoading && isLoggedIn && user?.role === 'administrator' && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/admin') {
        router.push('/admin');
      }
    }
  }, [isLoading, isLoggedIn, user?.role, router]);

  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Se não está logado, mostrar tela de login
  if (!isLoggedIn || !user) {
    return <LoginForm />;
  }

  // Se está logado mas não tem role válido, mostrar erro
  if (!user.role || (user.role !== 'administrator' && user.role !== 'agent')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Role não reconhecido
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    );
  }

  // Renderizar baseado no role
  if (user.role === 'administrator') {
    return <AdminLayout>{null}</AdminLayout>;
  } else if (user.role === 'agent') {
    return <AgentConversations />;
  }

  // Fallback - não deveria chegar aqui
  return <LoginForm />;
} 