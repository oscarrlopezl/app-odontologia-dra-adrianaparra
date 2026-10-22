# 🦷 GUÍA DE PUESTA A PUNTO: SUPABASE Y RENDER PARA LA DRA. ADRIANA PARRA

Esta guía explica paso a paso cómo registrar la infraestructura en **Supabase** y **Render** a nombre del correo oficial de la doctora (**`Od.adrianaparra@gmail.com`**), asegurando que:
1. **La base de datos, pacientes, radiografías y finanzas** pertenezcan a la cuenta de la doctora.
2. **El hosting en Render** esté conectado bajo su correo o el tuyo.
3. **El código fuente** permanezca 100% tuyo en tu repositorio personal de GitHub.

---

## PARTE 1: REGISTRO Y CONFIGURACIÓN EN SUPABASE

### Paso 1: Registro de la Cuenta en Supabase
1. Ingresa en [https://supabase.com](https://supabase.com).
2. Haz clic en **"Start your project"** o **"Sign In"**.
3. Selecciona **"Continue with Email"** y coloca el correo de la odontóloga: **`Od.adrianaparra@gmail.com`**.
4. Abre la bandeja de entrada de ese correo y confirma el enlace de acceso.

### Paso 2: Creación del Proyecto
1. Dale clic a **"New Project"**.
2. Completa los datos:
   - **Name**: `consultorio-dra-adrianaparra`
   - **Database Password**: Genera una contraseña segura y anótala.
   - **Region**: Selecciona `South America (São Paulo)` o `US East (N. Virginia)` para mejor velocidad en Venezuela.
   - **Pricing Plan**: `Free Plan` (0$ mensual, incluye 500 MB de base de datos y 1 GB de fotos).
3. Haz clic en **"Create new project"** y espera 1 minuto a que se aprovisione.

### Paso 3: Ejecutar la Estructura de Tablas (SQL)
1. En el menú lateral izquierdo de Supabase, entra en el **SQL Editor** (ícono `>_`).
2. Dale a **"New query"**.
3. Abre el archivo de tu proyecto: `supabase/schema.sql`.
4. Copia todo su contenido, pégalo en el editor SQL de Supabase y presiona el botón verde **"Run"**.
5. Te saldrá *"Success. No rows returned"*. ¡Listo! Ya están creadas las 10 tablas (pacientes, odontograma, historias, radiografías, presupuestos, pagos, agenda, caja, etc.).

### Paso 4: Habilitar el Storage para Radiografías
1. En el menú lateral de Supabase, entra en **Storage**.
2. Verifica si aparece el bucket llamado `radiografias`.
3. Si no existe, dale a **"New bucket"**, ponle de nombre `radiografias` y marca la casilla **"Public bucket"** para que las fotos carguen sin problemas en el navegador.

### Paso 5: Copiar las Llaves a tu `.env`
1. En Supabase, ve a **Project Settings** (engranaje abajo a la izquierda) -> **API**.
2. Copia:
   - **Project URL** (ej: `https://xyzabcdef.supabase.co`)
   - **anon public key** (ej: `eyJhbGciOiJIUzI1NiIsInR5cCI...`)
3. En la raíz de tu proyecto local, edita el archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto-real.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-real
   VITE_DOCTOR_EMAIL=Od.adrianaparra@gmail.com
   VITE_DOCTOR_NAME=Dra. Adriana Parra
   VITE_CLINIC_PHONE=+58 412-1234567
   VITE_DEFAULT_EXCHANGE_RATE=40.00
   ```

---

## PARTE 2: DESPLIEGUE EN RENDER (HOSTING EN LA NUBE GRATIS)

Para que la doctora y los pacientes puedan entrar desde cualquier PC o teléfono a través de un enlace de internet (ej: `https://dra-adrianaparra.onrender.com`):

### Paso 1: Subir el código a tu GitHub
1. Crea tu repositorio en [github.com/new](https://github.com/new) con tu cuenta.
2. En la terminal de este proyecto, corre:
   ```bash
   git remote add origin https://github.com/TU-USUARIO/app-odontologia-dra-adrianaparra.git
   git push -u origin main
   ```

### Paso 2: Crear el servicio en Render
1. Entra en [https://render.com](https://render.com).
2. Puedes registrarte con el correo de la doctora (`Od.adrianaparra@gmail.com`) o con el tuyo.
3. Dale a **"New +"** y selecciona **"Static Site"**.
4. Conecta tu repositorio de GitHub `app-odontologia-dra-adrianaparra`.
5. Configura los campos:
   - **Name**: `consultorio-dra-adrianaparra`
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
6. En la sección **"Environment Variables"** (Variables de Entorno), agrega:
   - `VITE_SUPABASE_URL` = tu URL copiada de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu llave anon copiada de Supabase
   - `VITE_DOCTOR_EMAIL` = `Od.adrianaparra@gmail.com`
   - `VITE_DOCTOR_NAME` = `Dra. Adriana Parra`
   - `VITE_DEFAULT_EXCHANGE_RATE` = `40.00`
7. En la pestaña **"Redirects/Rewrites"** de Render, agrega una regla para que React Router funcione al refrescar:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
8. Dale a **"Create Static Site"**. En 2 minutos tendrás tu app activa y pública en internet.

---

## 🔒 Privacidad y Autoría
- El archivo `.env` está en `.gitignore` para que tus credenciales nunca se filtren a GitHub.
- Tu código en GitHub solo contiene `.env.example`, manteniendo la autoría del desarrollo para ti mientras la clienta tiene la propiedad de su base de datos y hosting.
