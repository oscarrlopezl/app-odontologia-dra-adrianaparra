import React from 'react';
import DoctorHeader from '../../components/doctor/DoctorHeader';
import AppointmentCalendar from '../../components/doctor/AppointmentCalendar';

export default function AppointmentsPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      <DoctorHeader
        title="Agenda Odontológica y Tiempos de Sillón"
        subtitle="Control de consultas programadas, tiempos por procedimiento y recepción de solicitudes web"
      />

      <div className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
        <AppointmentCalendar />
      </div>
    </div>
  );
}
