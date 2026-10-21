# 🦷 GUÍA DE PUESTA A PUNTO: SUPABASE PARA LA DRA. ADRIANA PARRA

Esta guía explica paso a paso cómo registrar la infraestructura en **Supabase** a nombre exclusivo del correo de la doctora, asegurando que:
1. **La base de datos, pacientes, radiografías y finanzas** pertenezcan a la cuenta de la doctora.
2. **El código fuente** permanezca 100% tuyo en tu repositorio de GitHub.

---

## PASO 1: Registro de la Cuenta en Supabase
1. Ingresa en [https://supabase.com](https://supabase.com).
2. Haz clic en **"Start your project"** o **"Sign In"**.
3. Selecciona **"Continue with Email"** y coloca el correo de la odontóloga (ej: `dra.adrianaparra@gmail.com`).
4. Revisa la bandeja de entrada del correo para verificar el enlace de confirmación.

---

## PASO 2: Creación del Proyecto
1. Una vez dentro de Supabase, dale a **"New Project"**.
2. Completa los campos:
   - **Name**: `consultorio-dra-adrianaparra`
   - **Database Password**: Genera una contraseña segura y guárdala.
   - **Region**: Selecciona `South America (São Paulo)` o `US East (N. Virginia)` para menor latencia.
   - **Pricing Plan**: `Free Plan` (suficiente para iniciar con hasta 500 MB de base de datos y 1 GB de almacenamiento).
3. Haz clic en **"Create new project"** y espera 1-2 minutos mientras se aprovisiona.

---

## PASO 3: Ejecutar la Estructura de Tablas (SQL)
1. En el menú lateral izquierdo de Supabase, haz clic en el ícono de **SQL Editor** (parece una consola `>_`).
2. Haz clic en **"New query"**.
3. Abre el archivo de tu proyecto local: `supabase/schema.sql`.
4. Copia todo su contenido, pégalo en el editor SQL de Supabase y presiona el botón verde **"Run"**.
5. Verás el mensaje *"Success. No rows returned"*. ¡Listo! Ya tienes creadas todas las tablas:
   - Pacientes
   - Odontograma digital
   - Historias clínicas
   - Radiografías y fotos
   - Presupuestos por fases
   - Pagos, abonos y cuadre de caja
   - Citas y agenda
   - Promociones

---

## PASO 4: Habilitar el Storage para Radiografías
1. En el menú lateral de Supabase, entra en **Storage**.
2. Verifica si aparece el bucket llamado `radiografias`.
3. Si no existe, haz clic en **"New bucket"**, nómbralo `radiografias` y asegúrate de marcar la casilla **"Public bucket"** para que las fotos y panorámicas carguen sin problemas en el navegador.

---

## PASO 5: Conectar la App con las Llaves
1. En Supabase, ve a **Project Settings** (el engranaje abajo a la izquierda) -> **API**.
2. Copia:
   - **Project URL** (ej: `https://xyzcompany.supabase.co`)
   - **anon public key** (ej: `eyJhbGciOiJIUzI1NiIsInR5cCI...`)
3. En la raíz de tu proyecto, edita el archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto-real.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-real
   VITE_DOCTOR_EMAIL=dra.adrianaparra@gmail.com
   VITE_DOCTOR_NAME=Dra. Adriana Parra
   VITE_CLINIC_PHONE=+58 412-1234567
   VITE_DEFAULT_EXCHANGE_RATE=40.00
   ```
4. Guarda y reinicia el servidor de desarrollo (`npm run dev`).

---

## 🔒 Privacidad y GitHub
- El archivo `.env` está en `.gitignore` para que tus credenciales y las de la doctora **NUNCA** se suban a GitHub.
- Tu código en GitHub solo tendrá `.env.example`, manteniendo la autoría del software para ti mientras la clienta tiene la propiedad de sus datos médicos.
