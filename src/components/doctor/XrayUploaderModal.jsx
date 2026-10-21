import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import { uploadDentalImage } from '../../lib/storageService';
import { Upload, Image as ImageIcon, X, Loader2, AlertCircle } from 'lucide-react';

export default function XrayUploaderModal({ isOpen, onClose, patientId, patientName }) {
  const { addRadiograph } = useDental();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('panoramica');
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido (PNG, JPG, JPEG)');
        return;
      }
      setFile(selected);
      setError('');
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(selected);

      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !previewUrl) {
      setError('Debes adjuntar o seleccionar una imagen');
      return;
    }
    if (!title.trim()) {
      setError('Escribe un título descriptivo para la radiografía');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const imageUrl = await uploadDentalImage(file, patientId);

      await addRadiograph({
        patient_id: patientId,
        title,
        type,
        image_url: imageUrl,
        taken_at: takenAt,
        notes,
      });

      onClose();
    } catch (err) {
      setError(`Error al guardar la imagen: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">Subir Radiografía o Foto Clínica</h3>
            <p className="text-xs text-slate-700">Expediente de: <strong className="text-teal-700">{patientName}</strong></p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-600 hover:text-slate-600 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Zona de Drop / Carga de Archivo */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Archivo de Radiografía / Fotografía
            </label>

            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-56">
                <img src={previewUrl} alt="Vista previa" className="max-h-56 object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg shadow-md hover:bg-rose-700 text-xs"
                >
                  Cambiar imagen
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-teal-50/50 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-700">Haz clic para seleccionar imagen</span>
                <span className="text-xs text-slate-600 mt-1">Panorámica, periapical, oclusal o foto intraoral (JPG, PNG)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Título del Estudio *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Panorámica de Control Post-Cirugía"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Tipo de Imagen *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="panoramica">Radiografía Panorámica</option>
                <option value="periapical">Radiografía Periapical</option>
                <option value="oclusal">Radiografía Oclusal</option>
                <option value="fotografia_intraoral">Fotografía Intraoral / Diseño</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Fecha de la Toma
            </label>
            <input
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Hallazgos Radiológicos / Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Se visualiza adecuado selle apical sin signos de rarefacción periapical..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subiendo a la nube...</span>
                </>
              ) : (
                <span>Guardar Radiografía</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
