import { supabase, isConfigured } from './supabaseClient';

/**
 * Servicio para subir radiografías y fotografías clínicas.
 * Si Supabase está conectado, sube al bucket 'radiografias'.
 * Si está en modo demo/local, convierte la imagen a DataURL base64 persistente.
 */
export async function uploadDentalImage(file, patientId) {
  if (!file) throw new Error('No se seleccionó ningún archivo de imagen');

  const fileExt = file.name.split('.').pop();
  const fileName = `${patientId || 'temp'}_${Date.now()}.${fileExt}`;
  const filePath = `pacientes/${fileName}`;

  // Intentar subir a Supabase Storage si está configurado
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('radiografias')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Fallo al subir a Supabase Storage, usando respaldo local:', error.message);
      } else {
        const { data: publicData } = supabase.storage
          .from('radiografias')
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Error en storage Supabase:', err);
    }
  }

  // Respaldo confiable: Data URL Base64 para que la imagen se vea de inmediato
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
