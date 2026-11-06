# Wash Riders - Sistema de Inventarios

Aplicación Next.js para administrar productos, existencias, movimientos y reportes mensuales. PostgreSQL se conecta mediante `DATABASE_URL` (Neon).

## Configuración

Define estas variables en el entorno local y en Vercel:

- `DATABASE_URL`: cadena de conexión PostgreSQL de Neon.
- `AUTH_SECRET`: secreto aleatorio para firmar las sesiones. Si no se define, se usa `DATABASE_URL` como clave de respaldo.
- `NEXT_PUBLIC_DEVELOPER_EMAIL`: opcional. Dirección que abre el enlace "Contactar al desarrollador" del login.
- `ADMIN_BOOTSTRAP_PASSWORD`: opcional. Si no existe el usuario `admin`, esta contraseña permite crear la cuenta inicial. En desarrollo se usa `admin123` por defecto; en producción debe configurarse de forma explícita y eliminarse después del primer aprovisionamiento.

Las tablas `productos` y `movimientos` se crean automáticamente al consultar el inventario. La tabla `usuarios` se crea en el primer intento de inicio de sesión. Las contraseñas nuevas usan `scrypt`; las contraseñas existentes en texto plano se convierten al formato hash después de un inicio de sesión válido.

## Ejecución

```bash
npm ci
npm run dev
```

En desarrollo, las credenciales de prueba son `admin` / `admin123`. El panel puede abrirse en `http://localhost:3000`.

Antes de desplegar, configura `DATABASE_URL` y `AUTH_SECRET` en Vercel. Para aprovisionar el administrador inicial, establece temporalmente `ADMIN_BOOTSTRAP_PASSWORD` con una contraseña segura y accede como `admin`; luego elimina esa variable. No mantengas `admin123` como contraseña de producción.

## API

- `/api/login`: consulta de sesión (`GET`), inicio (`POST`) y cierre (`DELETE`).
- `/api/productos`: consulta (`GET`), creación (`POST`) y edición (`PUT`) del catálogo.
- `/api/inventario`: historial (`GET`), registro (`POST`) y edición (`PUT`) de movimientos.

Las rutas de productos, movimientos y dashboard requieren una sesión válida. Los movimientos actualizan stock e historial dentro de una transacción PostgreSQL. Las entradas de inventario reciben un código de seguimiento `WR-`; el reporte diario muestra también las compras de inventario y sus unidades junto con las ventas.
