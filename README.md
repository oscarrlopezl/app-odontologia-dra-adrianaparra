# 🦷 Sistema de Gestión Odontológica - Dra. Adriana Parra

Sistema clínico y administrativo especializado para consultorio odontológico, desarrollado con arquitectura desacoplada:
- **Base de Datos y Almacenamiento en la Nube:** Registrado bajo el correo de la **Dra. Adriana Parra** en **Supabase** (PostgreSQL + Supabase Storage).
- **Código Fuente:** Repositorio en GitHub perteneciente al desarrollador.

---

## 🚀 Arquitectura en Dos Entornos

### 1. Dashboard de Escritorio (PC de la Doctora) - `/doctor`
- **Gestión de Pacientes:** Fichas clínicas con datos de contacto, alertas médicas (alergias a penicilina, hipertensión, etc.) y contactos de emergencia.
- **Odontograma Digital Interactivo:** Sistema anatómico bajo nomenclatura FDI (32 piezas en adultos / 20 piezas en pediatría) con mapeo de 5 caras (vestibular, lingual, mesial, distal, oclusal) y registro de patologías (caries, resinas, coronas, endodoncias, implantes, extracciones).
- **Historias Clínicas:** Evolución cronológica de cada consulta, diagnósticos, procedimientos realizados, indicaciones post-operatorias y recetas médicas.
- **Subida de Radiografías a la Nube:** Almacenamiento en bucket de Supabase con visor de alta resolución para panorámicas, periapicales y fotos intraorales.
- **Agenda de Citas por Duración:** Planificación inteligente según el tipo de procedimiento (30m, 45m, 60m, 90m) y gestión de estados de sillón (*En Espera*, *En Sillón*, *Completada*).
- **Presupuestos por Fases:** Desglose del tratamiento en etapas progresivas (Saneamiento, Restauraciones, Prótesis/Ortodoncia) para facilitar la cobranza.
- **Control de Cobranzas y Abonos:** Monitoreo de saldo deudor, historial de abonos y soporte multimoneda (USD $ y Bolívares Bs con tasa oficial del día).
- **Cuadre de Caja Diario:** Arqueo de ingresos y registro de gastos menores de la clínica (insumos dentales, laboratorio de prótesis) por método de pago (Efectivo USD, Pago Móvil, Zelle, Punto de Venta).

### 2. Portal del Paciente (Móvil / Web Responsive) - `/portal`
- Vista optimizada para teléfono inteligente sin necesidad de instalar apps complejas.
- **Seguimiento de Tratamiento:** Visualización de fases completadas vs pendientes.
- **Historial de Consultas:** Detalle de lo que se le realizó en cada visita.
- **Estado de Cuenta Transparente:** Cuánto costó el tratamiento, cuánto ha abonado y saldo pendiente exacto.
- **Galería Radiográfica Personal:** Acceso directo a sus estudios y panorámicas.
- **Agendamiento en Línea:** Solicitud de turnos directamente conectada con la agenda del consultorio.
- **Promociones Activas:** Ofertas del mes y tips de salud bucodental de la doctora.

---

## 🛠️ Tecnologías Empleadas
- **Frontend:** React 18 / Vite 8
- **Estilos:** Tailwind CSS 3 con paleta médica personalizada
- **Iconografía:** Lucide React
- **Navegación:** React Router v7
- **Base de Datos y Storage:** Supabase (PostgreSQL, Storage Buckets, RLS Policies)

---

## 📋 Puesta en Marcha Rápida

### 1. Clonar e Instalar Dependencias
```bash
git clone <tu-repositorio-en-github>
cd app-odontologia-dra-adrianaparra
npm install
```

### 2. Variables de Entorno
Copia el archivo de ejemplo:
```bash
cp .env.example .env
```
Configura la URL y la Anon Key de Supabase que hayas creado con el correo de la odontóloga (ver guía detallada en `CONFIGURACION_SUPABASE_DOCTORA.md`).

> **Nota:** Si dejas las variables en blanco o con valores de prueba, el sistema corre automáticamente en **Modo Demostración / Local** con datos precargados para pruebas sin errores.

### 3. Ejecutar en Desarrollo
```bash
npm run dev
```

### 4. Compilar para Producción
```bash
npm run build
```

---

## 🔒 Privacidad y Autoría
El archivo `.env` está expresamente excluido del control de versiones mediante `.gitignore`. De este modo, las llaves de la base de datos de la doctora nunca se filtran a GitHub.
