# 🛒 E-commerce Full Stack

Aplicación de **e-commerce full stack** con arquitectura flexible que permite elegir entre dos backends:

- 🚀 **Backend propio** con **Node.js + Express + Prisma**
- ⚡ **Backend serverless** usando **Supabase**

El frontend está desarrollado con **React** y maneja autenticación, carrito, órdenes y roles de usuario.

---

## 📚 Tabla de Contenidos
1. [Tecnologías](#tecnologías)
2. [Configuración](#configuración)
3. [Arquitectura](#arquitectura)
4. [Funcionalidades](#funcionalidades)
5. [Instalación y Ejecución](#instalación-y-ejecución)
6. [Consideraciones](#consideraciones)
7. [Integraciones futuras](#integraciones-futuras)
8. [Autor](#autor)

---

## 🧱 Tecnologías

### Frontend
- ⚛️ React  
- 🟦 TypeScript  
- 🧠 Context API (Auth & Cart)  
- 🔗 Fetch API  

### Backend (modo Express)
- 🟢 Node.js  
- 🚂 Express  
- 🗄️ Prisma ORM  
- 🐘 PostgreSQL  
- 🔐 JWT  

### Backend (modo Supabase)
- 🔥 Supabase Auth  
- 🗄️ Supabase Database  
- 🔐 JWT automático (gestionado por Supabase)  

---

## ⚙️ Configuración

El proyecto soporta dos modos de backend, configurables desde el archivo `.env`.

### 📁 Variables de entorno

**Frontend**
```env
VITE_API_URL=http://localhost:3001/api
VITE_MERCADOPAGO_PUBLIC_KEY=YOUR_MERCADOPAGO_PUBLIC_KEY
MERCADOPAGO_ACCESS_TOKEN=YOUR_MERCADOPAGO_ACCESS_TOKEN
VITE_BACKEND_MODE=supabase
VITE_BACKEND_MODE=express
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=
