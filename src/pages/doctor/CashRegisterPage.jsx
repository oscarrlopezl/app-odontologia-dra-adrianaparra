import React from 'react';
import DoctorHeader from '../../components/doctor/DoctorHeader';
import CashRegisterReconciliation from '../../components/doctor/CashRegisterReconciliation';

export default function CashRegisterPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      <DoctorHeader
        title="Cuadre de Caja Diario y Arqueo"
        subtitle="Control de entradas y salidas de dinero por método de pago (Efectivo USD, Pago Móvil, Zelle, Punto)"
      />

      <div className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
        <CashRegisterReconciliation />
      </div>
    </div>
  );
}
