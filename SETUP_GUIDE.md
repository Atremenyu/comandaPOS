# Guía de Instalación y Despliegue Local - Comanda POS

Este documento detalla los pasos para montar la aplicación en un servidor local utilizando **Docker** para asegurar la sincronización entre múltiples dispositivos (Caja, Cocina, Tablets).

## Requisitos Previos

- **Docker Desktop** instalado y en ejecución.
- Red local (WiFi/LAN) donde todos los dispositivos puedan verse.

## Pasos para la Instalación

1. **Descargar el Proyecto:**
   Asegúrate de tener todos los archivos en una carpeta (incluyendo `docker-compose.yml`, `Dockerfile`, y la carpeta `server/`).

2. **Configurar el Entorno:**
   Crea o edita el archivo `.env.local` en la raíz del proyecto (frontend) con:
   ```env
   VITE_API_URL=http://IP_DE_TU_PC:3001
   ```
   *Nota: Reemplaza `IP_DE_TU_PC` por la dirección IP local de la computadora que servirá como servidor.*

3. **Lanzar con Docker:**
   Abre una terminal en la carpeta del proyecto y ejecuta:
   ```bash
   docker-compose up -d --build
   ```
   Este comando descargará las imágenes necesarias, compilará el frontend y el backend, e iniciará los servicios.

## Cómo Acceder

- **Desde la misma PC:** Entra a `http://localhost:3000`
- **Desde otros dispositivos (Tablets/Celulares):** Entra a `http://IP_DE_TU_PC:3000`

## Arquitectura del Sistema

- **Frontend (Puerto 3000):** Interfaz de usuario en React.
- **Backend (Puerto 3001):** Servidor Node.js que gestiona la base de datos y la comunicación en tiempo real (WebSockets).
- **Base de Datos:** SQLite alojada dentro del contenedor del backend (persistencia automática mediante volúmenes de Docker).

## Funciones Principales Implementadas

1. **Cocina:** Botón "Aceptar" con tiempo estimado y botón "Listo".
2. **Caja:** Monitor flotante con cronómetro en tiempo real y notificaciones de pedidos listos.
3. **Reportes:** Filtros por Día, Semana, Mes y Año con métricas de ventas.
4. **Turnos:** Sección de "Control de Turno" para cerrar la jornada y limpiar la pantalla de cocina.

---
*Desarrollado para el sistema Comanda POS - Red & Black Edition.*
