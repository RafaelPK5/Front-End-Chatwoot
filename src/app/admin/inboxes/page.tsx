'use client';

import dynamic from 'next/dynamic';

// Import dinâmico com tratamento de erro
const InboxManagement = dynamic(
  () => import('../../../components/admin/InboxManagement'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    ),
  }
);

export default function InboxesPage() {
  return <InboxManagement />;
} 