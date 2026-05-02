'use client';

import { useDeliveryController } from './controllers/useDeliveryController';
import { DeliveryList, DeliveryDetail } from './components/DeliveryList';
import { DeliveryForm } from './components/DeliveryForm';
import { DeliveryPrint } from './components/DeliveryPrint';

export default function DeliveriesPage() {
  const controller = useDeliveryController();
  const { state } = controller;

  if (state.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8', fontWeight: 600 }}>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <>
      {(() => {
        switch (state.view) {
          case 'detail':
            return <DeliveryDetail {...controller} />;
          case 'form':
            return <DeliveryForm {...controller} />;
          case 'list':
          default:
            return <DeliveryList {...controller} />;
        }
      })()}
      
      {/* Invisible print template (used by Detail view) */}
      <DeliveryPrint data={state.selected || state.form} />
    </>
  );
}
