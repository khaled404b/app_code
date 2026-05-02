'use client';

import { Suspense } from 'react';
import { useOfferController } from './controllers/useOfferController';
import { OfferList } from './components/OfferList';
import { OfferDetail } from './components/OfferDetail';
import { OfferForm } from './components/OfferForm';
import { OfferComparison } from './components/OfferComparison';

function OffersPageContent() {
  const controller = useOfferController();
  const { state } = controller;

  if (state.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <p style={{ color: '#94a3b8', fontWeight: 600 }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  switch (state.view) {
    case 'detail':
      return <OfferDetail {...controller} />;
    case 'form':
      return <OfferForm {...controller} />;
    case 'comparison':
      return <OfferComparison {...controller} />;
    case 'list':
    default:
      return <OfferList {...controller} />;
  }
}

export default function OffersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OffersPageContent />
    </Suspense>
  );
}
