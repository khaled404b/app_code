'use client';

import { useClientController } from './controllers/useClientController';
import { ClientList } from './components/ClientList';
import { ClientDetail } from './components/ClientDetail';
import { ClientForm } from './components/ClientForm';

export default function ClientsPage() {
  const controller = useClientController();
  const { state } = controller;

  if (state.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
          <p style={{ color: '#94a3b8', fontWeight: 600 }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  switch (state.view) {
    case 'detail':
      return <ClientDetail {...controller} />;
    case 'form':
      return <ClientForm {...controller} />;
    case 'list':
    default:
      return <ClientList {...controller} />;
  }
}
