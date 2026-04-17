🛒 E-commerce Full Stack

Aplicación de e-commerce full stack con arquitectura flexible que permite elegir entre dos backends:

🚀 Backend propio con Node.js + Express + Prisma
⚡ Backend serverless usando Supabase

El frontend está desarrollado con React y maneja autenticación, carrito, órdenes y roles de usuario.

🧱 Tecnologías
Frontend
⚛️ React
🟦 TypeScript
🧠 Context API (Auth & Cart)
🔗 Fetch API
Backend (modo Express)
🟢 Node.js
🚂 Express
🗄️ Prisma ORM
🐘 PostgreSQL (Supabase)
🔐 JWT
Backend (modo Supabase)
🔥 Supabase Auth
🗄️ Supabase Database
🔐 JWT automático (gestionado por Supabase)
⚙️ Configuración

El proyecto soporta dos modos de backend, configurables desde el .env.

📁 Variables de entorno
🔹 Frontend
VITE_API_URL=http://localhost:3001/api
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
🔹 Backend (Express)
DATABASE_URL=postgresql://usuario:password@host:puerto/db
JWT_SECRET=tu_jwt_secret

PORT=3001
CORS_ORIGIN=http://localhost:5173
🔹 Backend (Supabase)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_PUBLISHABLE_KEY=tu_publishable_key
🔀 Selección de backend

El comportamiento del sistema depende de:

VITE_USE_SUPABASE=true | false
Valor	Backend utilizado
true	Supabase
false	Express
🔐 Autenticación
Con Supabase
Login y registro gestionados por Supabase
Tokens JWT automáticos
Validación en backend con:
supabase.auth.getUser(token)
Con Express
Autenticación propia con JWT
Middleware de protección de rutas
Ejemplo:
jwt.verify(token, process.env.JWT_SECRET)
🧠 Arquitectura
Frontend (React)
│
├── AuthContext → Manejo de sesión
├── CartContext → Carrito global
│
├── API Layer
│   ├── Si USE_SUPABASE → Supabase SDK
│   └── Si NO → Fetch a Express API
│
Backend
│
├── Express API (opcional)
│   ├── Auth middleware
│   ├── Rutas: /cart, /orders, /products
│   └── Prisma ORM
│
└── Supabase (alternativa)
    ├── Auth
    ├── DB
    └── Policies
🛒 Funcionalidades
✅ Registro y login de usuarios
✅ Roles (admin / user)
✅ Carrito de compras
✅ Órdenes
✅ Persistencia en base de datos
✅ Protección de rutas
✅ Backend intercambiable
🧪 Desarrollo
Instalar dependencias
npm install
Frontend
npm run dev
Backend (Express)
node index.js
⚠️ Consideraciones
El backend Express requiere configuración manual de JWT
Supabase simplifica autenticación pero limita control backend
No mezclar ambos sistemas de auth al mismo tiempo
🚀 Próximas mejoras
💳 Integración con pagos (Stripe / MercadoPago)
📦 Gestión de stock
📊 Panel admin avanzado
🔄 Refresh tokens automático
🧾 Historial de compras
📌 Autor

Tomás Ríos
Desarrollador Full Stack
Argentina 🇦🇷