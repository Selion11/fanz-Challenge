# SeatMapBuilder - Interactive Floor Plan Editor

[cite_start]Este proyecto es un editor visual interactivo desarrollado para la prueba técnica de **Fanz**[cite: 1]. [cite_start]Permite la creación, edición y gestión de mapas de asientos complejos (teatros, estadios, eventos) con una experiencia de usuario orientada a la manipulación directa sobre el lienzo (WYSIWYG)[cite: 3, 4, 5].



## 🚀 Instrucciones de Inicio

[cite_start]Para facilitar el despliegue de ambos entornos (Frontend y Backend), el repositorio incluye un script de automatización.

1.  **Clonar el repositorio.**
2.  **Dar permisos de ejecución al script:**
    ```bash
    chmod +x run.sh
    ```
3.  **Iniciar la aplicación:**
    ```bash
    ./run.sh
    ```
    * [cite_start]**Frontend**: [http://localhost:3000](http://localhost:3000) (Next.js)[cite: 7].
    * [cite_start]**Backend**: [http://localhost:8080](http://localhost:8080) (Node.js Express / Next API)[cite: 7].

## 🛠️ Tecnologías Utilizadas

* [cite_start]**Frontend**: React + TypeScript + Next.js (App Router)[cite: 7].
* **Estilos**: Tailwind CSS para una interfaz moderna y eficiente.
* **Iconografía**: Lucide React.
* [cite_start]**Backend**: Node.js con servicios en memoria para persistencia rápida[cite: 7, 26].
* [cite_start]**Interacción**: Implementación nativa de transformaciones trigonométricas y selección por lotes (Lasso Selection)[cite: 12].

## 🧪 Tests

Para garantizar la integridad de los componentes y las funciones matemáticas de curvatura/rotación, se pueden ejecutar los tests mediante:

```bash
npm test
```
(Asegúrate de haber corrido npm install previamente en las carpetas correspondientes).


# 📐 Decisiones Técnicas y Supuestos
## Límites de Asientos e Investigación del Teatro Colón
Durante la fase de diseño, se investigaron las disposiciones de teatros de clase mundial, específicamente el Teatro Colón de Buenos Aires. Se observó lo siguiente para definir los límites de la aplicación:
 - Límites por Fila: Se estableció un máximo de 20 asientos por fila para mantener la legibilidad visual y la gestión de pasillos, similar a las filas de la Platea del Colón.

 - Geometría: La capacidad de curvar filas hasta 180° responde a la necesidad de replicar la arquitectura en forma de "herradura" característica de los teatros de ópera clásicos.

 - Etiquetado: Se implementó un sistema de reindexado automático (A-Z para filas, 1-N para asientos) para agilizar el flujo de trabajo en mapas de alta densidad.


## Persistencia y Estado
 - Se optó por mantener el estado en memoria del servidor para cumplir con el plazo del MVP sin añadir la complejidad de una base de datos externa, asegurando que el flujo de Import/Export sea el corazón de la persistencia de datos.


 - La lógica de exportación se delegó al backend para garantizar una separación de responsabilidades prolija y escalable.

# 🤖 Registro de IA
En cumplimiento con las reglas de la prueba, se adjunta el archivo prompts.json con el registro detallado de todas las interacciones, decisiones arquitectónicas y correcciones realizadas con el asistente de IA.

