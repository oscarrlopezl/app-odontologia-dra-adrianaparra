import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import {
  Printer,
  X,
  Send,
  Copy,
  Check,
  Receipt,
  MessageSquare,
  ShieldCheck,
  Calendar,
  DollarSign,
  Share2
} from 'lucide-react';
import { buildWhatsAppLink, cleanVenezuelanPhone } from '../../lib/whatsappService';

export default function BudgetDeliverModal({
  isOpen,
  onClose,
  budget,
  patient,
  payments = [],
}) {
  const { settings, showToast } = useDental();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !budget || !patient) return null;

  const exchangeRate = Number(settings?.usd_exchange_rate) || 883.4;

  // Cálculos financieros
  const patientPayments = payments.filter((p) => p.patient_id === patient.id);
  const totalPaidUsd = patientPayments.reduce((acc, curr) => acc + (Number(curr.amount_usd) || 0), 0);
  const totalBudgetUsd = Number(budget.total_amount) || 0;
  const balancePendingUsd = Math.max(0, totalBudgetUsd - totalPaidUsd);

  const totalBudgetBs = totalBudgetUsd * exchangeRate;
  const totalPaidBs = totalPaidUsd * exchangeRate;
  const balancePendingBs = balancePendingUsd * exchangeRate;

  const handlePrint = () => {
    window.print();
  };

  // Construir texto formal para WhatsApp
  const generateWhatsAppText = () => {
    const doctorName = settings?.doctor_name || 'Dra. Adriana Parra';
    const clinicName = settings?.clinic_name || 'Consultorio Odontológico Especializado';
    const address = settings?.address || 'Guacara / Yagua, Edo. Carabobo';
    const patientName = patient?.full_name?.trim() || 'Estimado(a) Paciente';

    let breakdownText = '';
    (budget.phases || []).forEach((ph, pIdx) => {
      breakdownText += `\n*Fase ${pIdx + 1}: ${ph.title}* (Subtotal: $${Number(ph.subtotal || 0).toFixed(2)})\n`;
      (ph.items || []).forEach((it) => {
        breakdownText += `  • ${it.description} - $${Number(it.cost || 0).toFixed(2)}\n`;
      });
    });

    const pagoMovilInfo = settings?.pago_movil_banco
      ? `\n🏦 *Datos de Pago Móvil:*\n• Banco: ${settings.pago_movil_banco}\n• Teléfono: ${settings.pago_movil_telefono || settings.phone}\n• Cédula/RIF: ${settings.pago_movil_cedula}\n• Titular: ${doctorName}\n`
      : '';

    return `🦷 *PRESUPUESTO ODONTOLÓGICO FORMAL*
*${doctorName}* • ${clinicName}
📍 ${address}

Estimado(a) *${patientName}*, le hacemos entrega de su plan de tratamiento y cotización:

📋 *Tratamiento:* ${budget.title}
${breakdownText}
───────────────────
💵 *Total Presupuesto:* $${totalBudgetUsd.toFixed(2)} USD (~Bs. ${totalBudgetBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
✅ *Total Abonado:* $${totalPaidUsd.toFixed(2)} USD (~Bs. ${totalPaidBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
💳 *Saldo Pendiente:* *$${balancePendingUsd.toFixed(2)} USD* (*~Bs. ${balancePendingBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*)

📊 *Tasa BCV Oficial:* 1 USD = ${exchangeRate.toFixed(2)} Bs.
${budget.notes ? `📝 *Condiciones:* ${budget.notes}\n` : ''}${pagoMovilInfo}
¡Estamos a su entera disposición para comenzar su tratamiento y cuidar de su sonrisa! ✨`;
  };

  const handleSendWhatsApp = () => {
    const phone = patient.phone;
    if (!phone) {
      alert('El paciente no tiene número de teléfono registrado.');
      return;
    }
    const clean = cleanVenezuelanPhone(phone);
    const text = generateWhatsAppText();
    const url = buildWhatsAppLink(clean, text);
    window.open(url, '_blank');
    if (showToast) showToast('Abriendo WhatsApp para entregar el presupuesto...', 'success');
  };

  const handleCopy = async () => {
    try {
      const text = generateWhatsAppText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (showToast) showToast('Presupuesto copiado al portapapeles', 'info');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Error al copiar:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 my-6 flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Barra de Acciones Superior (No visible al imprimir) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white rounded-t-3xl print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Hoja de Presupuesto para el Cliente</h3>
              <p className="text-[11px] text-teal-300">Formato formal de cotización y entrega</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition"
              title="Imprimir o guardar en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-md transition"
              title="Enviar directamente por WhatsApp al paciente"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Enviar WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition"
              title="Copiar texto del presupuesto"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENIDO DE LA HOJA DE PRESUPUESTO (Optimizado para Impresión y Pantalla) */}
        <div className="p-6 sm:p-8 overflow-y-auto print:p-0 print:border-none print:shadow-none space-y-6">
          
          {/* Membrete del Consultorio */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b-2 border-teal-600">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white p-1 border border-teal-100 shadow-sm flex items-center justify-center shrink-0">
                <img
                  src={settings?.logo_url || '/logo-dra-adrianaparra.png'}
                  alt="Dra. Adriana Parra"
                  className="max-h-12 w-auto object-contain"
                />
              </div>

              <div>
                <h2 className="font-extrabold text-lg text-slate-900 leading-tight">
                  {settings?.doctor_name || 'Dra. Adriana Parra'}
                </h2>
                <p className="text-xs text-teal-700 font-bold">
                  {settings?.doctor_specialty || 'Odontología Integral, Estética Dental y Rehabilitación Oral'}
                </p>
                <p className="text-[11px] text-slate-600">
                  {settings?.clinic_name || 'Centro Odontológico Especializado'}
                </p>
                <p className="text-[10px] text-slate-500">
                  📍 {settings?.address || 'Guacara / Yagua, Edo. Carabobo'} • 📞 {settings?.phone || '+58 412-1234567'}
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="inline-block bg-teal-50 border border-teal-200 text-teal-800 font-extrabold px-3 py-1 rounded-lg text-xs uppercase tracking-wider mb-1">
                Presupuesto Odontológico
              </span>
              <p className="font-mono text-slate-600 text-[11px]">
                Fecha: {new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Tasa Oficial BCV: 1 USD = {exchangeRate.toFixed(2)} Bs.
              </p>
            </div>
          </div>

          {/* Datos del Paciente */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Paciente:</span>
              <span className="font-extrabold text-slate-900 text-sm">{patient.full_name}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Cédula de Identidad:</span>
              <span className="font-mono font-bold text-slate-800">{patient.document_id || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Teléfono / WhatsApp:</span>
              <span className="font-mono font-bold text-teal-800">{patient.phone || 'N/A'}</span>
            </div>

            <div className="sm:col-span-3 pt-1 border-t border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tratamiento Propuesto:</span>
                <span className="font-bold text-slate-800">{budget.title}</span>
              </div>
              <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full uppercase">
                {budget.status || 'Activo'}
              </span>
            </div>
          </div>

          {/* Tabla Desglosada de Fases y Procedimientos */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              Desglose de Fases y Procedimientos Clínicos
            </h4>

            {(budget.phases || []).map((phase, pIdx) => {
              const phaseSubtotalUsd = Number(phase.subtotal) || 0;
              const phaseSubtotalBs = phaseSubtotalUsd * exchangeRate;

              return (
                <div
                  key={phase.id || pIdx}
                  className="rounded-2xl border border-slate-200 overflow-hidden text-xs"
                >
                  {/* Encabezado de la fase */}
                  <div className="bg-slate-100/80 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {pIdx + 1}
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {phase.title}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 text-xs">
                        Subtotal: ${phaseSubtotalUsd.toFixed(2)} USD
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono ml-1.5">
                        (~Bs. {phaseSubtotalBs.toFixed(2)})
                      </span>
                    </div>
                  </div>

                  {/* Procedimientos */}
                  <div className="divide-y divide-slate-100 bg-white">
                    {(phase.items || []).map((item, itIdx) => {
                      const itemCostUsd = Number(item.cost) || 0;
                      const itemCostBs = itemCostUsd * exchangeRate;

                      return (
                        <div
                          key={itIdx}
                          className="px-4 py-2 flex items-center justify-between hover:bg-slate-50/50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-teal-600 font-bold">•</span>
                            <span className="text-slate-800 font-medium">{item.description}</span>
                            {item.completed && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                Realizado
                              </span>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-slate-900">${itemCostUsd.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-2">
                              {itemCostBs.toFixed(2)} Bs
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cuadro de Totales Financieros */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white shadow-md grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border-b sm:border-b-0 sm:border-r border-teal-800/60 pb-3 sm:pb-0 sm:pr-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total del Tratamiento:
              </span>
              <span className="text-xl font-extrabold text-white block mt-0.5">
                ${totalBudgetUsd.toFixed(2)} USD
              </span>
              <span className="text-xs text-teal-300 font-mono">
                Bs. {totalBudgetBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="border-b sm:border-b-0 sm:border-r border-teal-800/60 pb-3 sm:pb-0 sm:pr-4">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Abonos Realizados:
              </span>
              <span className="text-xl font-extrabold text-emerald-300 block mt-0.5">
                ${totalPaidUsd.toFixed(2)} USD
              </span>
              <span className="text-xs text-emerald-400/80 font-mono">
                Bs. {totalPaidBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-rose-950/60 border border-rose-500/40 p-2.5 rounded-xl">
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
                Saldo Pendiente por Pagar:
              </span>
              <span className="text-xl font-extrabold text-rose-200 block mt-0.5">
                ${balancePendingUsd.toFixed(2)} USD
              </span>
              <span className="text-xs text-rose-300 font-mono">
                Bs. {balancePendingBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Condiciones y Métodos de Pago */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            {budget.notes && (
              <div>
                <span className="font-bold text-slate-800 block">Condiciones y Plan de Abonos:</span>
                <p className="text-slate-600 mt-0.5">{budget.notes}</p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/80">
              <span className="font-bold text-slate-800 block mb-1">Métodos de Pago Aceptados:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-teal-800 block">📲 Pago Móvil:</span>
                  <p>Banco: {settings?.pago_movil_banco || 'Banesco / Mercantil / Banco de Venezuela'}</p>
                  <p>Teléfono: {settings?.pago_movil_telefono || settings?.phone || '0412-1234567'}</p>
                  <p>Cédula/RIF: {settings?.pago_movil_cedula || 'V-12345678'}</p>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-teal-800 block">💵 Divisas en Efectivo:</span>
                  <p>Dólares ($ USD) o Euros (€ EUR) recibidos en taquilla.</p>
                  {settings?.zelle_email && (
                    <p className="mt-1">
                      <span className="font-bold">Zelle:</span> {settings.zelle_email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Firmas de Conformidad */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-slate-400 pt-2">
              <span className="font-extrabold text-slate-900 block">
                {settings?.doctor_name || 'Dra. Adriana Parra'}
              </span>
              <span className="text-[10px] text-slate-500">Odontólogo Tratante • Firma y Sello</span>
            </div>

            <div className="border-t border-slate-400 pt-2">
              <span className="font-extrabold text-slate-900 block">
                {patient.full_name}
              </span>
              <span className="text-[10px] text-slate-500">
                Conformidad del Paciente / Cédula: {patient.document_id || '___________'}
              </span>
            </div>
          </div>

          {/* Pie de página de validez */}
          <div className="text-center text-[10px] text-slate-400 pt-2">
            Este presupuesto tiene una validez de 15 días hábiles a partir de su emisión. Valores en Bolívares sujetos a variación de la tasa oficial del BCV.
          </div>
        </div>
      </div>
    </div>
  );
}
