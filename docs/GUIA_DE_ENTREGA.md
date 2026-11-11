# Guía de usuario, técnica y entrega

## Wash Riders — Sistema de Inventarios

**Versión documentada:** estado del código fuente al preparar esta guía

**Fecha de preparación:** 11 de noviembre de 2026

**Jurisdicción de referencia para la lista de verificación:** Colombia

**Destinatarios:** cliente, administrador del negocio, operadores, personal técnico y responsable de la entrega.

> **Importante — alcance legal.** Esta guía explica el software y sirve como base para documentar una entrega. No es un concepto jurídico, no constituye una certificación de cumplimiento y no reemplaza el contrato, el acta de aceptación ni la revisión de un abogado. Las obligaciones dependen, entre otros factores, de quién contrata y opera el sistema, qué datos procesa, cómo se factura el servicio y qué se pactó. Los campos entre corchetes deben ser completados por las partes antes de firmar.

---

## 1. Identificación del producto

Wash Riders es una aplicación web para consultar un catálogo de productos y administrar existencias mediante entradas y salidas. Ofrece un tablero de resumen, registro de ventas/salidas, registro de movimientos manuales y reportes diarios y mensuales imprimibles.

### 1.1 Propósito

- Mantener un catálogo activo de productos con código, nombre, precio y existencias.
- Registrar entradas y salidas y actualizar el stock asociado.
- Consultar alertas cuando las existencias llegan al stock mínimo o quedan por debajo.
- Consultar ventas y compras por periodo a partir de los movimientos registrados.
- Proporcionar una interfaz web en español para personal autorizado.

### 1.2 Lo que no debe confundirse con el alcance del producto

La aplicación principal es un control operativo de inventario. No debe considerarse, sin una validación y contratación adicionales, como:

- Un sistema contable o de nómina.
- Un servicio de facturación electrónica o un proveedor tecnológico autorizado por la DIAN.
- Un sistema certificado de punto de venta o de emisión de documentos tributarios.
- Una conciliación bancaria o un sistema de pagos.
- Un sistema de gestión de clientes (CRM).
- Un registro inalterable o una solución de archivo electrónico con garantías de conservación legal.
- Un servicio con respaldo automático, recuperación ante desastres o disponibilidad garantizada. Esos compromisos deben verificarse y pactarse con el proveedor de infraestructura y en el contrato de soporte.

Los reportes y la impresión del navegador son ayudas operativas. No sustituyen la factura electrónica ni los libros, comprobantes o soportes que correspondan al negocio.

---

## 2. Arquitectura y componentes

### 2.1 Arquitectura lógica

1. **Presentación:** la aplicación web usa Next.js App Router, React y TypeScript. La pantalla principal (`app/page.tsx`) contiene el acceso y, tras autenticar, muestra el panel. El menú cambia de vista dentro de esa pantalla; no navega a una URL distinta por cada sección.
2. **Lógica de servidor:** las rutas `app/api/**/route.ts` reciben solicitudes HTTP, validan los datos y aplican las operaciones del inventario.
3. **Datos:** PostgreSQL es la base relacional. El servidor se conecta mediante `pg` y la variable `DATABASE_URL`; el inventario principal se guarda en `productos` y `movimientos`.
4. **Autenticación:** el servidor valida credenciales y firma una cookie `HttpOnly` con vencimiento de ocho horas. Los endpoints principales comprueban esa cookie antes de operar.
5. **Hosting:** el README propone Vercel para la aplicación y Neon para PostgreSQL. Son opciones documentadas, no evidencia de que exista un despliegue activo; el hosting, dominio, región y configuración de producción deben confirmarse aparte.

**Diagrama resumido:** `Navegador (Next.js/React) → API del servidor (Next.js) → PostgreSQL`. La cookie viaja en las solicitudes autenticadas. No se observa una API externa o un servicio Firebase en el flujo principal de inventario.

### 2.2 Tecnologías declaradas

- **Lenguajes:** TypeScript para la aplicación y JavaScript/JSX mediante el ecosistema Node.js; SQL para consultas y definición de tablas. HTML y CSS se generan/estilizan desde React y Tailwind.
- **Framework y runtime:** Next.js `16.2.3`, React y React DOM `19.2.4`; Node.js en el servidor.
- **Base de datos:** PostgreSQL, con `pg` como cliente.
- **Estilos e iconos:** Tailwind CSS 4 y Heroicons React.
- **Herramientas de desarrollo:** TypeScript 5, ESLint 9 y PostCSS mediante `@tailwindcss/postcss`.

Las versiones y rangos declarados están en `package.json`; `package-lock.json` fija las versiones resueltas para instalaciones reproducibles con `npm ci`.

### 2.3 Rutas principales del usuario

| Vista | Cómo se llega | Función |
|---|---|---|
| Inicio de sesión | Al abrir `/` sin sesión válida | Permite autenticarse. |
| Inicio / Resumen de inventario | Menú lateral → Inicio | Resume productos, existencias, stock bajo, movimientos del día y ventas recientes. |
| Productos | Menú lateral → Productos o ficha «Productos registrados» | Busca, crea, edita y retira productos del catálogo. |
| Registrar venta | Menú lateral → Registrar venta | Registra una venta o una salida de varios productos en una sola operación. |
| Registrar movimiento | Menú lateral → Registrar movimiento | Registra una entrada o salida manual individual y permite editar movimientos manuales. |
| Historial | Menú lateral → Historial | Consulta y filtra entradas y salidas; permite editar movimientos manuales. |
| Reporte de ventas | Menú lateral → Reporte de ventas | Consulta un día y permite imprimir el reporte. |
| Reporte mensual | Menú lateral → Reporte mensual | Consulta un mes y permite imprimir/guardar desde el diálogo de impresión del navegador. |

El menú también permite cambiar entre tema claro y oscuro y cerrar la sesión.

### 2.4 Componentes y API no conectados al menú principal

El menú principal de `app/page.tsx` conecta el tablero, catálogo, salidas, movimientos e informes de inventario. El repositorio también contiene vistas y rutas adicionales de pedidos/caja, usuarios, configuración, recetas y analítica financiera; no están conectadas a ese menú. Su presencia en el código no demuestra que estén habilitadas, completas, probadas o incluidas en la aceptación del sistema.

En particular, no se debe presentar como parte del flujo principal la gestión de empleados y permisos, configuración del negocio, caja/pedidos o recetas. El código inspeccionado tampoco acredita emisión de facturas electrónicas. Antes de incluir cualquiera de estas capacidades en el acta, verificar su integración, persistencia, permisos y pruebas en el ambiente de entrega.

### 2.5 Funciones principales del panel activo

- **Acceso:** consulta el estado de sesión al cargar, inicia sesión y permite cerrar sesión.
- **Tablero:** presenta existencias, productos con stock bajo, productos más movidos, movimientos del día y ventas recientes. Los datos se consultan desde las API de productos y movimientos.
- **Catálogo:** busca productos por nombre o código; crea, modifica y retira productos sin borrar su historial. Al abrir la sección, sincroniza el catálogo WR Colombia incluido en el código.
- **Ventas y salidas agrupadas:** registra de uno a cien productos en una misma operación; los tipos disponibles son venta, uso interno y otro motivo.
- **Movimientos manuales e historial:** registra entradas y salidas individuales, consulta el historial y permite editar movimientos manuales.
- **Reportes:** filtra entradas/salidas por día o mes y prepara una vista imprimible con las opciones del navegador.
- **Preferencias de interfaz:** cambia entre tema claro y oscuro; la preferencia se guarda en el almacenamiento local del navegador.

### 2.6 Estructura técnica del repositorio

| Ubicación | Responsabilidad |
|---|---|
| `app/page.tsx` | Pantalla raíz: login, estado de sesión y selección de vistas del panel. |
| `app/layout.tsx` y `app/globals.css` | Estructura HTML compartida, metadatos, fuentes y estilos globales. |
| `app/components/Sidebar.tsx` | Navegación del panel activo y acciones de sesión/tema. |
| `app/components/admin/` | Componentes de tablero, productos, movimientos, ventas y reportes. |
| `app/api/` | Endpoints HTTP del servidor. Algunos corresponden a funciones adicionales no enlazadas al menú principal. |
| `lib/auth.ts` | Hash/verificación de contraseñas y creación/verificación de sesiones. |
| `lib/db.ts` | Pool de conexiones de PostgreSQL. |
| `lib/inventory-db.ts` | Creación y ampliación de las tablas principales de inventario. |
| `lib/inventory-tracking.ts` y `lib/wr-product-list.ts` | Código de seguimiento y catálogo inicial WR. |
| `package.json` / `package-lock.json` | Scripts y dependencias declaradas/resueltas. |

### 2.7 Dependencias directas

Las versiones siguientes son las declaradas en `package.json`; los rangos con `^` pueden resolver a una versión compatible más reciente según el lockfile.

| Dependencia | Versión declarada | Uso / estado en el repositorio |
|---|---:|---|
| `next` | `16.2.3` | Framework de páginas y endpoints de servidor. |
| `react` / `react-dom` | `19.2.4` | Componentes e interfaz web. |
| `pg` | `^8.20.0` | Conexión y consultas a PostgreSQL. |
| `@heroicons/react` | `^2.2.0` | Iconos de la interfaz. |
| `tailwindcss` | `^4` | Utilidades de estilos CSS. |
| `@tailwindcss/postcss` | `^4` | Integración de Tailwind con PostCSS. |
| `typescript` | `^5` | Tipado y verificación del código TypeScript. |
| `eslint` | `^9` | Análisis estático y lint. |
| `eslint-config-next` | `16.2.3` | Reglas de ESLint para Next.js. |
| `@types/node`, `@types/pg`, `@types/react`, `@types/react-dom` | `^20`, `^8.20.0`, `^19`, `^19` | Definiciones de tipos para desarrollo. |
| `firebase` | `^12.18.0` | Está declarado y existe `lib/firebase.ts`, pero no se encontró uso de ese módulo en el flujo actual. |
| `browser-image-compression` | `^2.0.2` | Declarado; no se encontró importación en `app/` o `lib/`. |
| `xlsx` | `^0.18.5` | Declarado; no se encontró importación en `app/` o `lib/`. |

Firebase, compresión de imágenes y lectura de Excel deben considerarse dependencias instaladas pero no activas en las funciones inspeccionadas; no se deben describir como capacidades operativas del panel sin integrar y probar su uso. No hay una librería dedicada de gráficas o generación de PDF en las dependencias directas: las gráficas y la impresión se resuelven desde componentes web y el navegador.

### 2.8 Flujo técnico de una operación

1. El operador selecciona una acción en el panel.
2. El componente React envía una solicitud `fetch` a una ruta `/api/...` en formato JSON.
3. La ruta comprueba la cookie de sesión y valida los campos recibidos.
4. La ruta consulta o actualiza PostgreSQL mediante consultas parametrizadas.
5. En operaciones de stock, el servidor usa una transacción para mantener el saldo y el historial coherentes; si hay un error, revierte la operación.
6. La API devuelve JSON con el resultado o un estado HTTP de error; la interfaz actualiza los datos o presenta el error.

### 2.9 Explicación sencilla para la exposición

> “Wash Riders es una aplicación web para controlar productos y existencias. Está desarrollada con TypeScript, React y Next.js. El usuario trabaja desde un panel que permite consultar el stock, registrar entradas y salidas, hacer ventas de varios productos y revisar reportes. Cuando realiza una operación, la pantalla envía los datos a una API del servidor; el servidor valida la sesión y la información, actualiza el inventario y guarda el movimiento en PostgreSQL dentro de una transacción. Así se conserva tanto el saldo actual como el historial. El proyecto también contiene módulos adicionales, pero solo presentamos como funcionales los que están conectados y probados en el panel principal.”

**Versión de 20 segundos:** “Es un sistema web de inventario con interfaz React/Next.js, API en el servidor y base de datos PostgreSQL. Permite administrar productos, controlar entradas y salidas, registrar ventas agrupadas y consultar informes. La API valida cada operación y actualiza stock e historial de forma transaccional.”

---

## 3. Guía de uso para el operador

### 3.1 Inicio de sesión

1. Abra la dirección web comunicada por el administrador.
2. Escriba el usuario y la contraseña asignados.
3. Seleccione **Iniciar sesión**.
4. Para cerrar el acceso al terminar, use **Cerrar sesión** en el menú lateral.

La cookie de sesión tiene duración de ocho horas y se invalida al cerrar sesión o al expirar. No comparta credenciales entre operadores si el negocio necesita atribuir acciones a una persona concreta: el sistema principal no presenta un registro de auditoría por operador en sus vistas.

**No use la contraseña de desarrollo `admin123` en producción.** El administrador inicial debe aprovisionarse con una clave segura y retirar después la variable temporal de aprovisionamiento, según la sección 7.

### 3.2 Inicio: lectura de las tarjetas

- **Productos registrados:** cantidad de productos activos en el catálogo. Al seleccionarla, abre Productos.
- **Producto más movido hoy:** producto con mayor cantidad acumulada de entradas y salidas registradas para la fecha local del navegador.
- **Unidades disponibles:** suma de las existencias actuales de los productos activos.
- **Alertas de stock bajo:** cantidad de productos cuyo stock actual es menor o igual al stock mínimo. Al seleccionarla, muestra cada producto, su código, existencias y mínimo.
- **Unidades movidas hoy:** suma de las cantidades de movimientos del día. Al seleccionarla, presenta el detalle por producto y diferencia entradas de salidas.
- **Ingresos de hoy:** suma de cantidad por precio unitario para movimientos de salida marcados como venta.

Los detalles de las tarjetas se cierran con el botón **Cerrar detalle**. El botón **Actualizar** vuelve a consultar productos y movimientos.

Los días del tablero se calculan con la hora local del navegador. Para que las cifras coincidan con la operación colombiana, los dispositivos de trabajo deben tener correctamente configurada su zona horaria.

### 3.3 Administración del catálogo

1. Abra **Productos**.
2. Use el buscador por nombre o código para localizar un artículo.
3. Seleccione **Nuevo producto** para crear un registro.
4. Complete código, nombre, precio, existencias iniciales y stock mínimo.
5. Guarde el producto. Para modificarlo, use el botón de edición en la fila.
6. Para retirarlo, use el botón de retiro y confirme la acción.

Reglas observables en la API:

- Código y nombre son obligatorios; el código no puede duplicarse, sin distinguir mayúsculas/minúsculas.
- El precio y las cantidades no pueden ser negativos.
- Las cantidades deben ser enteras; el precio puede tener decimales.
- La categoría se guarda como `General` desde el formulario actual.
- Retirar un producto lo oculta del catálogo activo, pero no borra el registro ni sus movimientos históricos.
- La existencia inicial que se introduce al crear un producto no genera por sí misma un movimiento de entrada. Si se necesita trazabilidad del saldo inicial, registrar y conservar un soporte del inventario de apertura.

#### Integración del catálogo WR Colombia

Al abrir Productos, la aplicación intenta integrar una lista predefinida de nombres de productos WR. Los artículos nuevos se crean con código `WRC-...`, existencias `0`, stock mínimo `4` y precio `0`; los duplicados se omiten. El proceso también retira del catálogo activo registros cuyo nombre o código sea `Bolt`.

La integración no completa precios ni existencias y no reemplaza la revisión del catálogo por el negocio. Antes de vender los artículos importados, el operador debe asignar sus precios y registrar las existencias reales. Confirmar que se cuenta con autorización para usar los nombres, marcas y demás información del catálogo incorporado.

### 3.4 Registrar una venta o salida por lote

1. Abra **Registrar venta**.
2. Busque productos por nombre o código y selecciónelos.
3. Añada cantidades al carrito; compruebe el stock disponible y el total.
4. Seleccione el motivo disponible: venta, uso interno u otro. Para **Otro**, indique el detalle solicitado.
5. Registre la operación y espere el mensaje de confirmación.

Validaciones y efectos:

- La operación acepta entre 1 y 100 artículos y agrupa líneas repetidas del mismo producto.
- La cantidad debe ser un entero positivo y no puede superar el stock.
- Para el motivo **Venta**, cada producto requiere un precio mayor que cero.
- La API valida todas las existencias dentro de una transacción de base de datos. Si hay stock insuficiente o un producto inválido, no debe completarse parcialmente la operación.
- Al guardar, se descuenta el stock y se registran los movimientos correspondientes.
- Las ventas reciben un código de seguimiento `WR-...`; las salidas que no son venta no reciben ese código de venta.
- El precio unitario utilizado queda en el movimiento y se usa para los ingresos de los reportes.

El carrito es temporal en el navegador hasta enviar la operación. Verifique la confirmación antes de cerrar o recargar la página.

### 3.5 Registrar movimiento manual

1. Abra **Registrar movimiento**.
2. Seleccione un producto.
3. Elija **Entrada** o **Salida**.
4. Seleccione un motivo: compra, venta, uso interno, daño, donación, ajuste u otro (según tipo y validaciones).
5. Introduzca una cantidad entera positiva, fecha y motivo/detalle.
6. Registre y conserve el código de seguimiento si la interfaz lo presenta.

Una entrada aumenta el stock; una salida lo reduce. No se permite guardar una salida que deje el stock negativo. Las entradas usan el precio actual del producto como precio unitario almacenado en el movimiento. Una venta debería registrarse por el flujo de **Registrar venta**, que genera una operación agrupada y aplica sus validaciones de venta.

### 3.6 Consultar historial y corregir movimientos

- **Historial** muestra los movimientos en orden descendente por fecha.
- Use búsqueda para filtrar por nombre, código, código de seguimiento o motivo.
- Use el filtro de tipo para limitar a entradas o salidas.
- Los movimientos asociados a una venta agrupada están protegidos contra edición desde movimientos manuales. La interfaz/API conserva la venta como una sola operación.
- Los movimientos manuales editables recalculan el stock mediante una transacción. Antes de corregir uno, confirme el soporte original y el efecto esperado sobre el inventario.

Retirar un producto no elimina su historial. Evite corregir registros para ocultar una diferencia física; documente el motivo del ajuste y conserve el soporte.

### 3.7 Reportes

**Reporte de ventas**

- Seleccione la fecha que desea consultar.
- Revise ventas, cantidades e ingresos calculados con precio unitario × cantidad.
- El reporte diario presenta ventas y compras del periodo, además de sus unidades.
- Seleccione **Imprimir reporte** y use el diálogo del navegador para imprimir o guardar como PDF.

**Reporte mensual**

- Seleccione el mes.
- Revise totales, evolución diaria y detalles de ventas; el informe también presenta información de compras y productos.
- Use **Descargar PDF**. La descarga se realiza mediante la función de impresión del navegador; depende de las opciones disponibles en el dispositivo y navegador.

Los reportes reflejan los movimientos que están registrados en la base de datos y los filtros temporales de la aplicación. No certifican que cada movimiento corresponda a una factura, un pago recibido o un asiento contable.

---

## 4. Conceptos de datos e inventario

### 4.1 Tablas principales

| Tabla | Propósito | Campos principales |
|---|---|---|
| `productos` | Catálogo y saldo actual | `id`, `codigo`, `nombre`, `categoria`, `precio`, `stock_actual`, `stock_minimo`, `disponible` |
| `movimientos` | Historial de entradas y salidas | `id`, `producto_id`, `tipo`, `cantidad`, `motivo_tipo`, `motivo`, `precio_unitario`, `fecha`, `transaccion_id`, `codigo_seguimiento` |
| `usuarios` | Credenciales usadas por el inicio de sesión | `id`, `usuario`, `password`, `nombre` |

Las tablas de inventario se crean o amplían desde la aplicación si no existen ciertas columnas. La tabla de usuarios se crea en el flujo de inicio de sesión. Esta inicialización automática no sustituye un procedimiento formal de migraciones, control de cambios o respaldo antes de actualizar la base de datos.

Hay endpoints adicionales que consultan tablas como `pedidos`, `configuracion`, `configuracion_negocio`, `inventario`, `receta_producto` y `usuarios_admin`. Esas tablas no forman parte del esquema central creado por `lib/inventory-db.ts`; su definición, disponibilidad y relación con el panel deben verificarse aparte.

### 4.2 Reglas relevantes

- `ENTRADA` incrementa el stock y `SALIDA` lo decrementa.
- La cantidad de cada movimiento debe ser mayor que cero.
- El saldo se almacena en `productos.stock_actual`; el historial se almacena en `movimientos`.
- La integridad entre movimiento y producto se establece por `producto_id`.
- `transaccion_id` agrupa operaciones con varias líneas.
- `codigo_seguimiento` permite localizar la operación en la interfaz y los reportes.
- `precio_unitario` es el valor registrado con el movimiento, no necesariamente el precio vigente hoy.
- Las existencias son enteras; el precio es decimal.
- La alerta se activa con `stock_actual <= stock_minimo`.

### 4.3 Reconciliación operativa recomendada

1. Defina una fecha de apertura y cuente físicamente las existencias.
2. Cargue los productos y sus cantidades iniciales.
3. Conserve un acta/archivo del inventario inicial, fecha, responsables y diferencias.
4. Desde la fecha acordada, registre cada entrada y salida sin omisiones.
5. Compare periódicamente el inventario físico con el saldo del sistema.
6. Registre diferencias mediante ajustes con motivo y soporte, conforme a las políticas del negocio.
7. Concilie los ingresos reportados con los soportes de pago y contabilidad por un proceso separado.

---

## 5. API principal

Todas estas rutas utilizan solicitudes HTTP JSON, salvo que se indique lo contrario. Las rutas de inventario y catálogo requieren una sesión válida.

| Ruta | Métodos principales | Uso |
|---|---|---|
| `/api/login` | `GET`, `POST`, `DELETE` | Activa: consultar sesión, autenticar y cerrar sesión. |
| `/api/productos` | `GET`, `POST`, `PUT`, `DELETE` | Activa: consultar, crear, editar y retirar productos. `DELETE` es un retiro lógico. |
| `/api/productos/importar` | `POST` | Activa: integra el catálogo WR Colombia al abrir Productos. |
| `/api/inventario` | `GET`, `POST`, `PUT` | Activa: consultar historial (opcionalmente por rango de fechas), registrar y editar movimientos manuales. |
| `/api/ventas` | `POST` | Activa: registrar una venta/salida agrupada de varios productos. |
| `/api/productos/status` | `PATCH` | Endpoint adicional para cambiar disponibilidad; no está conectado al flujo principal inspeccionado. |
| `/api/configuracion` | `GET`, `PUT` | Endpoint adicional de configuración del negocio; no está enlazado desde el menú principal. |
| `/api/dashboard/resumen` | `GET`, `POST` | Endpoint adicional de métricas financieras/meta; el tablero de inventario activo usa `/api/productos` y `/api/inventario`. |
| `/api/pedidos` | `GET`, `POST`, `PUT`, `DELETE` | Endpoints adicionales de pedidos/caja; no están enlazados desde el menú principal. |
| `/api/recetas` | `GET`, `POST` | Endpoint adicional de recetas/insumos; no está enlazado desde el menú principal. |
| `/api/usuarios` | `POST` | Endpoint adicional de verificación de usuario; no está enlazado desde el menú principal. |
| `/api/usuarios/verificar` | `POST`, `DELETE` | Endpoint adicional de verificación/eliminación de usuarios; no está enlazado desde el menú principal. |

Los endpoints de productos, inventario, ventas y las rutas adicionales comprueban una sesión válida. `/api/login` es la excepción funcional para consultar o iniciar sesión; el cierre elimina la cookie. Respuestas de error comunes:

- `400`: datos incompletos, fuera de formato o inválidos.
- `401`: sesión no autorizada o credenciales inválidas.
- `404`: producto o movimiento inexistente.
- `409`: duplicado, stock insuficiente o conflicto de operación.
- `500`: error de servidor o base de datos.

La API no debe exponerse directamente a integraciones externas sin revisar autenticación, permisos, límites de uso, validación, registro de auditoría y contrato de datos.

---

## 6. Instalación, configuración y despliegue

### 6.1 Requisitos

- Node.js compatible con Next.js 16.
- npm.
- PostgreSQL accesible desde el servidor de la aplicación.
- Variables de entorno configuradas para el ambiente correspondiente.

El repositorio no fija un número exacto de versión de Node.js en `package.json`; confirmar la versión compatible con Next.js 16 en el entorno de despliegue.

### 6.2 Variables de entorno

| Variable | Obligatoria | Propósito |
|---|---:|---|
| `DATABASE_URL` | Sí | Cadena de conexión a PostgreSQL. Mantenerla privada. |
| `AUTH_SECRET` | Sí en producción, recomendado siempre | Secreto de firma de sesiones, aleatorio y privado. Si no está definido, el código usa `DATABASE_URL` como respaldo. |
| `ADMIN_BOOTSTRAP_PASSWORD` | Temporal para aprovisionar | Clave inicial del administrador cuando el usuario `admin` todavía no existe. Retirar después de aprovisionar. |
| `NEXT_PUBLIC_DEVELOPER_EMAIL` | No | Correo para el enlace de contacto que se muestra en el inicio de sesión. Es público en el frontend. |

En desarrollo, el código contempla `admin123` como contraseña temporal si el usuario administrador no existe y no se define otra. En producción no se debe depender de ese valor. Las variables `NEXT_PUBLIC_*` son visibles al cliente y nunca deben contener secretos.

**No** subir archivos `.env`, contraseñas, cadenas de conexión, datos reales o copias de la base de datos al repositorio, a tickets públicos ni a servicios no autorizados.

### 6.3 Ejecución local

```bash
npm ci
npm run dev
```

La aplicación queda disponible normalmente en `http://localhost:3000`. Para compilar y ejecutar como producción:

```bash
npm run build
npm run start
```

`npm run lint` ejecuta ESLint.

### 6.4 Despliegue productivo (lista operativa)

1. Crear y verificar el proyecto de PostgreSQL en el ambiente aprobado.
2. Configurar `DATABASE_URL` y un `AUTH_SECRET` criptográficamente aleatorio en el gestor de secretos del hosting.
3. Configurar temporalmente `ADMIN_BOOTSTRAP_PASSWORD` con una clave única y segura para aprovisionar `admin`.
4. Desplegar desde la versión de código aprobada y confirmar que el build finaliza.
5. Abrir la aplicación por HTTPS y probar login, catálogo, movimiento, venta y reportes.
6. Confirmar que la cookie de sesión se marca como segura en producción.
7. Eliminar `ADMIN_BOOTSTRAP_PASSWORD` del entorno una vez creada la cuenta inicial.
8. Cambiar/rotar la credencial inicial según el procedimiento aprobado y conservarla en un gestor seguro.
9. Configurar y probar por separado las copias de seguridad y el proceso de restauración.
10. Registrar dominio, proveedor, región, ambiente, versión desplegada, responsables y fecha en el acta de entrega, sin copiar secretos al documento.

La documentación del repositorio no fija región de alojamiento, retención, RPO/RTO, SLA, frecuencia de copias ni política de restauración. Estos datos deben obtenerse del proveedor y acordarse con el cliente.

---

## 7. Seguridad, privacidad y tratamiento de información

### 7.1 Controles presentes en el código

- Las rutas principales verifican una cookie de sesión firmada.
- La cookie es `HttpOnly`, `SameSite=Lax`, tiene duración limitada y usa `Secure` cuando `NODE_ENV` es producción.
- Las nuevas contraseñas se almacenan con scrypt y sal aleatoria; el código contiene compatibilidad de verificación para contraseñas antiguas y las convierte a scrypt al iniciar sesión correctamente.
- La base de datos recibe consultas parametrizadas para las operaciones principales de producto, movimiento y venta.
- Las ventas y movimientos actualizan stock e historial dentro de transacciones de PostgreSQL.

Estos son controles implementados, no una auditoría de seguridad ni una certificación. La existencia de controles no elimina la necesidad de probar la configuración productiva.

### 7.2 Limitaciones que deben quedar claras en la entrega

- El menú principal implementa un inicio de sesión, pero no una matriz de roles y permisos por usuario para las funciones del inventario.
- La pantalla principal no expone una gestión completa de usuarios, cambio/recuperación de contraseña ni flujo de invitación.
- La aplicación no documenta en el repositorio un mecanismo de auditoría inmutable con identidad individual para cada cambio.
- No se encontró en la guía del proyecto una política implementada de respaldo/restauración, retención, monitoreo o respuesta a incidentes.
- El sistema de inventario no debe usarse para capturar datos personales sensibles. Si los usuarios escriben datos personales en los campos de motivo/detalle, esos datos pueden quedar almacenados en movimientos.
- El proveedor de nube y la configuración regional de almacenamiento deben revisarse frente a las obligaciones contractuales y de protección de datos.

### 7.3 Lista de verificación de protección de datos para Colombia

Antes de poner el sistema en operación real, el responsable del negocio y su asesor jurídico deben determinar si los datos tratados son datos personales, quién actúa como responsable y quién como encargado, y documentar las obligaciones que correspondan. Como mínimo, verificar:

- Finalidad y minimización: no solicitar ni registrar información personal que no sea necesaria para inventario.
- Política de tratamiento y aviso de privacidad aplicables al negocio y al canal de recolección.
- Base jurídica/autorización cuando sea exigible, y procedimiento para consultas, reclamos y derechos del titular.
- Contratos e instrucciones con proveedores que acceden o alojan datos, ubicación/transferencias y medidas de seguridad.
- Retención, eliminación, respaldo y devolución de información al terminar el servicio.
- Procedimiento para incidentes de seguridad y para atender requerimientos de titulares y autoridades.
- Si existen datos personales fuera del alcance de este inventario, evaluar las obligaciones adicionales y registros que resulten aplicables.

Referencias normativas para revisión con asesoría jurídica (no son una declaración de cumplimiento): **Ley 1581 de 2012** y su reglamentación compilada, entre otros, en el **Decreto 1074 de 2015**; régimen andino de derecho de autor, incluida la **Decisión Andina 351 de 1993**; y **Ley 23 de 1982** con sus modificaciones. La aplicabilidad concreta depende del tratamiento y del contrato.

### 7.4 Propiedad intelectual y componentes de terceros

La entrega debe identificar quién es titular del código, diseños, marca, documentación, datos de catálogo y modificaciones, así como qué derechos se transfieren o licencian. Debe acompañarse de:

- Contrato o licencia que autorice el uso, modificación, despliegue y mantenimiento del software.
- Inventario de dependencias de terceros y sus licencias (puede generarse a partir del lockfile y herramientas de inventario de software).
- Confirmación de derechos o autorización sobre la marca y lista de productos WR incluida en el catálogo.
- Tratamiento de componentes, fuentes, imágenes, logos y contenidos aportados por cliente o proveedor.
- Procedimiento para entregar el código y credenciales sin revelar secretos en repositorios o documentos públicos.

La licencia del repositorio no se debe inferir de la disponibilidad del código fuente. Debe quedar definida por escrito entre las partes.

### 7.5 Referencias jurídicas no exhaustivas

- **Ley 1581 de 2012** y **Decreto 1074 de 2015**: consultar el texto y sus modificaciones en el [Gestor Normativo de Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/).
- **Decisión Andina 351 de 1993**: consultar el texto vigente en el [portal de la Comunidad Andina](https://www.comunidadandina.org/).
- **Ley 23 de 1982** y sus modificaciones: consultar el texto vigente en [SUIN-Juriscol](https://www.suin-juriscol.gov.co/).

Verificar vigencia, modificaciones y pertinencia normativa con asesoría jurídica al momento de firmar.

---

## 8. Operación, soporte y mantenimiento

### 8.1 Tareas sugeridas

**Diarias**

- Confirmar que el catálogo y el saldo inicial son correctos antes de operar.
- Registrar movimientos durante el turno y revisar mensajes de confirmación.
- Investigar alertas y diferencias físicas antes de ajustar cantidades.
- Verificar que la base de datos y la aplicación estén disponibles.

**Periódicas**

- Realizar conteos físicos y conciliarlos con el sistema.
- Revisar productos activos, códigos duplicados conceptualmente, precios y mínimos.
- Verificar copias de seguridad y ejecutar pruebas de restauración en un ambiente controlado.
- Revisar usuarios/credenciales autorizados y rotar secretos cuando corresponda.
- Revisar dependencias y desplegar actualizaciones con copia de seguridad previa.

### 8.2 Respaldo y restauración

El código de la aplicación no implementa por sí mismo una rutina de respaldo automático. El responsable técnico debe documentar en un procedimiento separado:

- Proveedor y método del respaldo.
- Frecuencia, cifrado, ubicación, retención y responsable.
- Tiempo objetivo de recuperación (RTO) y punto objetivo de recuperación (RPO) acordados.
- Método para restaurar en un ambiente aislado y verificar integridad.
- Procedimiento para restaurar la aplicación y las variables de entorno sin publicar secretos.
- Fecha y resultado de la última prueba de restauración.

No declarar que hay respaldo probado hasta que se haya ejecutado y registrado una restauración real.

### 8.3 Solución de problemas

| Síntoma | Verificaciones iniciales |
|---|---|
| No permite iniciar sesión | Usuario/clave, existencia de `usuarios`, estado del despliegue y logs del servidor; confirmar aprovisionamiento del administrador. |
| Error al cargar productos o movimientos | Acceso a PostgreSQL, `DATABASE_URL`, disponibilidad del proveedor y logs de la API. |
| No aparece un producto | Confirmar que no fue retirado, volver a cargar la vista y revisar filtros/búsqueda. |
| No permite registrar venta | Verificar stock, cantidad entera positiva, precio mayor que cero para venta, sesión y disponibilidad del producto. |
| Una alerta de stock aparece inesperadamente | La condición es stock actual menor o igual al mínimo; validar cantidad real, mínimo y movimientos recientes. |
| El reporte no coincide con caja/contabilidad | Revisar periodo/zona horaria, movimientos registrados, motivos y precio unitario; conciliar contra soportes externos. El reporte de inventario no sustituye la caja o contabilidad. |
| No se puede editar un registro de venta | Las ventas agrupadas se protegen frente a edición manual; revisar el flujo autorizado de corrección y conservar evidencia. |

Al escalar un incidente, adjunte fecha/hora, ambiente, pantalla/ruta, identificador de operación y mensaje no sensible. Nunca adjunte contraseñas, cookies, tokens ni la cadena `DATABASE_URL`.

---

## 9. Pruebas y criterios de aceptación sugeridos

Ejecutar en un ambiente de prueba con datos ficticios antes de aceptar la entrega. Conservar evidencia (fecha, ambiente, versión, resultado y responsable).

| ID | Prueba | Resultado esperado |
|---|---|---|
| A01 | Abrir la aplicación sin sesión | Se presenta inicio de sesión; vistas y API protegidas no quedan accesibles como usuario autenticado. |
| A02 | Iniciar sesión con credenciales autorizadas y cerrar sesión | Acceso correcto; cierre invalida la sesión. |
| A03 | Crear producto válido | Producto aparece en catálogo activo con valores correctos. |
| A04 | Crear producto con código duplicado | API/UI informa conflicto y no crea duplicado. |
| A05 | Crear/editar con stock o precio negativo | Operación rechazada. |
| A06 | Registrar entrada | Stock aumenta y se agrega movimiento con fecha, motivo y cantidad. |
| A07 | Registrar salida manual que excede stock | Se rechaza; stock e historial quedan sin cambios parciales. |
| A08 | Retirar producto | Desaparece del catálogo activo y movimientos históricos siguen consultables. |
| A09 | Registrar venta de varios productos con stock suficiente | Se crea la operación agrupada, se descuenta cada cantidad y se muestra código de seguimiento. |
| A10 | Registrar venta con un artículo sin stock/precio | Se rechaza la operación; no se descuenta parcialmente el resto del carrito. |
| A11 | Generar movimientos del día | Las tarjetas del tablero y detalles muestran cantidades esperadas bajo la zona horaria acordada. |
| A12 | Configurar stock igual al mínimo | El artículo aparece en alerta de stock bajo. |
| A13 | Consultar reporte diario y mensual | Fechas, operaciones y totales coinciden con datos de prueba; impresión funciona en navegador aprobado. |
| A14 | Actualizar la página/desplegar nueva instancia | Los datos persisten en PostgreSQL y la sesión se comporta según su expiración. |
| A15 | Verificar respaldo/restauración | La base se restaura en entorno controlado y se comprueba la integridad de productos y movimientos. |

La aceptación debe especificar navegador/dispositivos, versión de prueba, datos de prueba, defectos conocidos y quién autoriza los resultados. Las pruebas deben repetirse en producción con operaciones controladas y reversibles antes de abrir el sistema al personal.

---

## 10. Paquete documental para la entrega

No existe una lista universal de documentos que, por sí sola, haga legal cualquier entrega de software. El contrato, la naturaleza del servicio, los datos tratados y el modelo de licenciamiento determinan qué instrumentos se requieren. Para una entrega ordenada, revisar y completar este paquete:

### 10.1 Documentos de producto y operación

- Esta guía de usuario/técnica, con versión y fecha.
- Guía de despliegue y configuración de ambientes.
- Diagrama de arquitectura y flujos de datos (puede añadirse como anexo).
- Inventario de variables de entorno sin incluir sus valores secretos.
- Diccionario de datos y descripción de campos.
- Procedimiento de respaldo, restauración, continuidad y soporte.
- Registro de pruebas de aceptación y defectos conocidos.
- Inventario de dependencias/licencias de terceros.
- Manual de administración de credenciales, contactos y escalamiento.

### 10.2 Instrumentos contractuales y legales a validar

- Contrato de desarrollo/licencia/cesión, orden de servicio o documento equivalente.
- Alcance funcional acordado, exclusiones, entregables, plazos y criterios de aceptación.
- Acta de entrega y recibo, con versión, ambiente, fecha, responsables y reservas.
- Definición expresa de titularidad del código fuente, componentes, modificaciones y datos.
- Acuerdo de confidencialidad si procede.
- Acuerdo de tratamiento de datos/instrucciones con proveedores, cuando corresponda.
- Política y aviso de privacidad del negocio, canales para derechos de titulares y procedimiento de incidentes, si existe tratamiento de datos personales.
- Términos de soporte/mantenimiento, niveles de servicio, garantías, límites, costos y vigencia.
- Licencias y avisos de terceros, y autorización sobre marcas, catálogos y materiales incorporados.
- Relación de servicios de terceros, responsables, regiones, costos y vencimientos.

### 10.3 Datos que el receptor debe cambiar al tomar posesión

- Contraseña inicial y, si aplica, usuario administrador.
- `AUTH_SECRET` y credenciales de base de datos según política de rotación.
- Accesos de hosting, DNS, repositorio, base de datos, correo y monitoreo.
- Variables temporales de bootstrap y credenciales de prueba.
- Contactos y correo de soporte.

Entregar las credenciales por un canal seguro y separado del acta. La persona que las recibe debe confirmar cambio/rotación y registrar los custodios autorizados.

---

## 11. Plantilla de acta de entrega y aceptación

Completar con las partes y condiciones reales del contrato. No firmar campos incompletos que sean materiales para el alcance o la titularidad.

### ACTA DE ENTREGA Y RECIBO DE SOFTWARE

**Proyecto:** Wash Riders — Sistema de Inventarios

**Contrato/orden de servicio:** [número, fecha y enlace o referencia]

**Fecha y lugar:** [fecha, ciudad]

**Proveedor/desarrollador:** [nombre o razón social, identificación, representante]

**Cliente/receptor:** [nombre o razón social, identificación, representante]

**Versión/código entregado:** [tag, commit, release o hash verificable]

**Ambiente entregado:** [URL, hosting, región, base de datos/proveedor]

**Responsables técnicos:** [nombres y contactos]

#### 11.1 Entregables recibidos

- [ ] Aplicación desplegada en el ambiente indicado.
- [ ] Código fuente en [repositorio/medio], con commit o versión [referencia].
- [ ] Guía de usuario, operación y soporte.
- [ ] Variables de configuración documentadas (sin secretos).
- [ ] Credenciales entregadas por canal seguro y custodios identificados.
- [ ] Inventario de dependencias/licencias adjunto.
- [ ] Procedimiento de copia de seguridad y restauración adjunto/probado.
- [ ] Resultado de pruebas de aceptación adjunto.
- [ ] Otros: [detalle].

#### 11.2 Alcance funcional recibido

Marcar solo lo que se verificó en el ambiente de entrega:

- [ ] Inicio de sesión y cierre de sesión.
- [ ] Tablero de inventario y alertas.
- [ ] Catálogo de productos (crear, editar y retirar).
- [ ] Integración del catálogo predefinido WR, con autorización de uso confirmada.
- [ ] Registro de ventas/salidas agrupadas.
- [ ] Registro de entradas/salidas manuales e historial.
- [ ] Reportes diario/mensual e impresión desde navegador.
- [ ] Otro alcance contratado: [descripción y evidencia].

**Exclusiones/no recibidos:** [p. ej., facturación electrónica, contabilidad, administración de roles, caja/pedidos si no fueron integrados y probados].

#### 11.3 Pruebas y aceptación

**Plan de pruebas/referencia:** [documento o enlace]

**Fecha y ambiente de pruebas:** [detalle]

**Resultado:** [aceptado / aceptado con reservas / rechazado]

**Defectos o reservas pendientes:** [ID, descripción, severidad, responsable y fecha acordada]

**Criterios de resolución:** [cómo se comprobarán y quién aprueba]

La aceptación del funcionamiento descrito no implica que el sistema sea un servicio de facturación electrónica, sistema contable certificado, ni que se hayan satisfecho obligaciones legales distintas de las expresamente verificadas y pactadas.

#### 11.4 Seguridad, datos y propiedad intelectual

**Responsable del tratamiento (si aplica):** [nombre/identificación/contacto]

**Encargados/proveedores y ubicación de datos:** [proveedor, servicio, región, contrato]

**Datos incluidos al entregar:** [describir; declarar si son datos de prueba o producción]

**Procedimiento de cambio de credenciales:** [referencia y fecha límite]

**Titularidad/licencia del software:** [cláusula/contrato]

**Componentes de terceros y licencias:** [anexo]

**Autorización de marca/catálogo/contenidos:** [referencia documental]

**Copia de respaldo verificada:** [fecha, alcance y resultado; no declarar si no se probó]

**Política/aviso de privacidad revisados por:** [responsable y fecha, cuando aplique]

#### 11.5 Soporte y garantías pactadas

**Periodo de garantía:** [duración y alcance contractual]

**Soporte/mantenimiento:** [canal, horario, tiempos pactados, tarifas y vigencia]

**Disponibilidad/continuidad:** [SLA, RPO/RTO y proveedor, si se contrataron]

**Fecha de inicio de operación:** [fecha]

**Fecha de fin de soporte/licencia:** [fecha o condición]

#### 11.6 Firmas

Las partes declaran que revisaron los entregables y las reservas consignadas en esta acta. Las firmas no sustituyen las cláusulas del contrato ni modifican sus términos salvo acuerdo escrito válido.

| Por el proveedor | Por el cliente |
|---|---|
| Nombre: [ ] | Nombre: [ ] |
| Identificación: [ ] | Identificación: [ ] |
| Cargo: [ ] | Cargo: [ ] |
| Firma: [ ] | Firma: [ ] |
| Fecha: [ ] | Fecha: [ ] |

---

## 12. Información pendiente para completar antes de una entrega formal

El repositorio no identifica por sí solo todos los datos que normalmente se requieren en el acta o en los documentos del contrato. Confirmar y adjuntar:

1. Razón social, NIT/identificación, domicilio y representantes de proveedor y cliente.
2. Número y fecha del contrato, alcance acordado, precio, pagos, vigencia y jurisdicción pactada.
3. Titularidad o licencia del software y derechos sobre modificaciones.
4. URL de producción, proveedor, región, titularidad de cuentas y responsable de costos.
5. Credenciales y mecanismo seguro para transferirlas; nunca incluir sus valores en esta guía.
6. Política real de respaldos, restauración probada, retención, RPO/RTO y responsables.
7. Datos personales que se ingresarán, finalidades y roles de responsable/encargado.
8. Licencias de terceros y autorización de catálogo, marca, imágenes y contenidos.
9. Criterios de aceptación, resultados de pruebas, defectos aceptados y plan de corrección.
10. Garantía, soporte, mantenimiento, disponibilidad y procedimiento de terminación/devolución o eliminación de datos.
11. Aprobación jurídica y de protección de datos para el caso concreto.

La guía queda como base documental; los campos que dependen del negocio o del contrato no se deben completar por inferencia.
