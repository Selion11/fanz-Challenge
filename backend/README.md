# SeatMapBuilder - Backend MVP (Fanz Challenge) [cite: 1]

Este repositorio contiene el núcleo lógico y la API para un editor visual interactivo de mapas de asientos. El sistema permite la gestión dinámica de áreas, filas y mesas con un motor de validación robusto y persistencia en memoria.

## 🚀 Tecnologías Utilizadas

* **Next.js 14+**: Utilizado para los **Route Handlers** (API) aprovechando el App Router.
* **TypeScript**: Tipado estricto para garantizar la integridad de la estructura de datos en elementos como filas, asientos y mesas.
* **Jest**: Framework de testing para pruebas unitarias y de integración (E2E).
* **Node.js Crypto**: Uso de `randomUUID` para la generación nativa de identificadores únicos, optimizando la compatibilidad con entornos de test.

## 🏛️ Decisiones Técnicas y Supuestos

### 1. Límites de Capacidad (Inspiración: Teatro Colón)
Para definir las restricciones de integridad y asegurar un rendimiento óptimo en el renderizado visual, se tomaron límites basados en la arquitectura del **Teatro Colón**:
* **Filas por Área (Máx. 15)**: Basado en la profundidad visual de sectores de platea y palcos.
* **Asientos por Fila (Máx. 20)**: Basado en la disposición lógica de butacas por sección para mantener la navegabilidad.
* **Mesas por Área (Máx. 20)**: Definido para sectores de eventos o gastronomía.

### 2. Etiquetado Automático y Patrones
Se implementó un motor de **re-etiquetado reactivo** para cumplir con el requisito de etiquetas obligatorias
* **Patrones Secuenciales**: El sistema genera etiquetas automáticamente (ej: M1, M2 o Platea 1, Platea 2).
* **Gestión de Huecos**: Al eliminar un elemento intermedio, el sistema renombra automáticamente los restantes para mantener la coherencia del patrón.

### 3. Modelo de Datos Jerárquico

El esquema se diseñó de forma anidada para permitir la exportación/importación de un solo objeto JSON sin pérdida de datos:
* **SeatMap**: `id`, `nombre_plano`, `areas[]`.
* **Area**: `id`, `nombre_area`, `elementos[]`.
* **RowElement**: `tipo: 'fila'`, `etiqueta`, `precio`, `asientos[]`.
* **TableElement**: `tipo: 'mesa'`, `etiqueta`, `precio`, `sillas[]`.

## 📡 Documentación de la API

### Endpoints de Mapa y Sistema
* `GET /api/maps`: Lista todos los planos en memoria.
* `POST /api/maps`: Crea un nuevo plano vacío.
* `GET /api/maps/[id]`: **(Exportar)** Obtiene la estructura completa de un mapa específico.
* `POST /api/maps/system?action=reset`: **(Nuevo Mapa)** Limpia toda la memoria del servidor.
* `POST /api/maps/system?action=import`: **(Importar)** Recibe un JSON completo y lo carga en el sistema.

### Endpoints de Elementos
* `POST /api/maps/[id]/areas`: Gestión de sectores.
* `POST /api/maps/[id]/areas/[areaId]/rows`: Creación individual o por lotes de filas.
* `POST /api/maps/[id]/areas/[areaId]/tables`: Gestión de mesas y sus sillas individuales.

## 🧪 Testing

El proyecto cuenta con **61 pruebas automatizadas** que cubren el 100% de los requerimientos de la consigna.

### Ejecución de tests:
```bash
npm run test
```
Los tests validan la creación de múltiples filas , validaciones de etiquetas obligatorias y el flujo de importación/exportación sin pérdida de datos.

### 🛠️ Setup e Instalación
* Instalar dependencias: npm install
* Correr en modo desarrollo: npm run dev

### Registro de Prompts (IA)
Se adjunta el archivo prompts.json detallando decisiones técnicas, esquemas de datos y supuestos asumidos durante el desarrollo.