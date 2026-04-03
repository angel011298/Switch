# Reporte Técnico: Migración a Arquitectura Multi-Tenant (M:N)
**Fecha:** 3 de abril de 2026
**Estado:** Completado y Desplegado

## 1. Objetivo
Transformar el ERP de una relación 1:N (Usuario pertenece a 1 Empresa) a una relación M:N (Usuario puede colaborar en N Empresas) bajo una única identidad global.

## 2. Cambios en Infraestructura (Prisma)
Se eliminaron las columnas `tenantId` y `role` de la tabla `User` y se introdujo el modelo `TenantMembership`.

### Modelos Afectados:
- **User:** Ahora contiene datos de identidad global (nombre, avatar, timezone, MFA).
- **TenantMembership:** Tabla pivot que vincula `User` con `Tenant`, almacenando el `role` específico por empresa.
- **Tenant:** Sin cambios estructurales mayores, pero ahora referenciado vía membresías.

## 3. Correcciones de Regresión (Post-Migración)
Tras la migración inicial, se identificaron y resolvieron los siguientes fallos:

### A. Autenticación (Supabase Auth Hook)
- **Problema:** El hook `custom_access_token_hook` fallaba al intentar acceder a `User.tenantId`.
- **Solución:** Se redefinió la función SQL para consultar `TenantMembership` y extraer el contexto de la empresa activa.
- **Archivo de Referencia:** `auth-hook-fix.sql` (Ejecutado en Supabase SQL Editor).

### B. Paneles de Administración
- **Admin Maestro:** Se actualizó `app/(dashboard)/admin/page.tsx` para listar organizaciones y usuarios a través de sus membresías.
- **Gestión de Organización:** Se refactorizaron las Server Actions en `app/(dashboard)/admin/organizacion/actions.ts` para permitir el cambio de roles dentro de la tabla de membresías.

### C. Flujo de Registro (Signup)
- **Sincronización:** Se actualizó `app/login/actions.ts` para que la creación inicial de un Tenant use `memberships` en lugar de la relación directa borrada.

## 4. Nuevas Funcionalidades
- **Tenant Switcher:** Selector de empresas en el Header principal (persistencia vía cookies).
- **Mi Perfil:** Vista completa en `/settings/profile` para gestionar identidad y seguridad global.

## 5. Instrucciones de Mantenimiento
Cualquier nueva consulta que requiera el rol del usuario o su empresa debe:
1. Obtener el `tenantId` desde la sesión (JWT o cookie).
2. Consultar `prisma.tenantMembership` para validar permisos.

---
*Este documento ha sido generado automáticamente para persistencia en el repositorio.*
