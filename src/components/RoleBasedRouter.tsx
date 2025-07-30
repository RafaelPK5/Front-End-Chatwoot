'use client';

import { useUserStore } from '../store/userStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginForm from './ui/LoginForm';
import AgentConversations from './agent/AgentConversations';

export default function RoleBasedRouter() {
  const { user, isLoggedIn } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    // Se está logado e é administrador, redireciona para /admin
    if (isLoggedIn && user?.role === 'administrator') {
      router.push('/admin');
    }
  }, [isLoggedIn, user?.role, router]);

  // Se não está logado, mostra a tela de login
  if (!isLoggedIn) {
    return <LoginForm />;
  }

  // Se está logado, roteia baseado no role
  if (user?.role === 'administrator') {
    // Mostra loading enquanto redireciona
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (user?.role === 'agent') {
    return <AgentConversations />;
  }

  // Fallback para roles desconhecidos
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Role não reconhecido
        </h1>
        <p className="text-gray-600">
          Seu role ({user?.role}) não é suportado pelo sistema.
        </p>
      </div>
    </div>
  );
} 