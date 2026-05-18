'use client';

import React from 'react';
import { useContractorsController } from './controllers/useContractorsController';
import { ContractorList } from './components/ContractorList';
import { ContractorForm } from './components/ContractorForm';

export default function ContractorsPage() {
  const controller = useContractorsController();
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
      {state.view === 'list' && <ContractorList {...controller} />}
      {state.view === 'form' && <ContractorForm {...controller} />}
    </>
  );
}
