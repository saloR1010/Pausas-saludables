# Pausa 🌿 — Agente de pausas activas

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![Sin dependencias](https://img.shields.io/badge/dependencias-0-brightgreen?style=for-the-badge)](#estructura-del-proyecto)
[![Idioma: español](https://img.shields.io/badge/idioma-espa%C3%B1ol-green?style=for-the-badge)](#pausa--agente-de-pausas-activas)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-green?style=for-the-badge)](LICENSE)

Aplicación web **estática, sin dependencias ni build**, que convierte el agente descrito en `pausas-activas.md` en una herramienta usable: eliges una duración y obtienes los 3 pasos, una guía con temporizador y un texto listo para copiar a Telegram.

## ✨ Características

- **3 pasos fijos** en el mismo orden: movimiento → descanso visual → respirar y soltar.
- **Regla 20-20-20** aplicada en el paso visual (mirar a ~6 m, parpadear y cerrar los ojos).
- **Cierre obligatorio** con respiración 4-6 y soltura de mandíbula y hombros.
- **Tiempos exactos**: la suma de los 3 pasos siempre iguala la duración elegida.
- **Duraciones rápidas**: 2, 3, 4, 5 y 10 minutos.
- **Duración personalizada**: cualquier valor entre 2 y 60 min (pasos de 0,5 min), interpolando las proporciones de la tabla.
- **Guía interactiva**: cuenta atrás por paso, barra de progreso y aviso sonoro opcional.
- **Versión Telegram** de 2 líneas (límite: 3) con botón «Copiar».
- **Modo oscuro** con botón 🌙/☀️, detectado del sistema y guardado en `localStorage`.
- **Favicon SVG** propio (hoja sobre fondo verde).
- **Accesible y adaptable**: etiquetas ARIA, foco visible, diseño responsive y respeto a `prefers-reduced-motion`.
- Tono cercano y breve, sin explicaciones largas.

## 🚀 Uso

No hay nada que instalar. Abre `index.html` con doble clic o sirve la carpeta:

```bash
# Opción 1: abrir index.html directamente en el navegador

# Opción 2 (recomendada, evita limitaciones del protocolo file://)
python -m http.server 8000
# Visita http://localhost:8000
```

Flujo: elige una duración (o escribe una personalizada) → pulsa **Generar mi pausa** → (opcional) **Iniciar guía** → **Copiar** el texto de Telegram. El botón 🌙 de la esquina alterna entre modo claro y oscuro.

## 🧠 Reglas del agente

Estas reglas son la fuente de verdad y están definidas en [`pausas-activas.md`](pausas-activas.md):

1. Dar siempre **3 pasos claros**.
2. Cubrir **movimiento** y **descanso visual** (20-20-20).
3. Cerrar con **respiración + soltar tensión** (mandíbula y hombros).
4. Los tiempos de los 3 pasos **deben sumar la duración pedida**.
5. Terminar con una versión para **Telegram de máximo 3 líneas**, lista para copiar.
6. Felicitar de forma ligera el esfuerzo previo, sin cursilería.

| Duración | Movimiento | Visual (20-20-20) | Respirar y soltar |
|:--------:|:----------:|:-----------------:|:-----------------:|
| 2 min    | 0,5 min    | 1 min             | 0,5 min           |
| 3 min    | 1 min      | 1 min             | 1 min             |
| 4 min    | 1 min      | 1,5 min           | 1,5 min           |
| 5 min    | 1,5 min    | 2 min             | 1,5 min           |
| 10 min   | 3 min      | 4 min             | 3 min             |

Para duraciones fuera de la tabla se interpolan estas proporciones en unidades de 30 segundos. Así, todos los pasos son múltiplos de 0,5 min, el paso visual se descompone en `N × 20 s + N × 10 s` y el de respiración en `3N` ciclos de 4-6 s. Ejemplo: 7 min → 2 min + 3 min + 2 min.

## 📁 Estructura del proyecto

```text
Agente IA/
├── index.html          # Interfaz: duraciones, pasos, temporizador, tema y Telegram
├── styles.css          # Temas claro/oscuro, componentes y diseño responsive
├── app.js              # Lógica: pausas, interpolación, guía, copiado y tema
├── favicon.svg         # Icono de la hoja 🌿
├── pausas-activas.md   # Especificación original del agente (rol, reglas y plantillas)
├── README.md           # Documentación, badges y guía de uso
├── LICENSE             # Licencia MIT
└── .gitignore          # Archivos ignorados por Git
```

### ¿Dónde cambiar algo?

- **Textos o tiempos predefinidos**: objeto `CONFIG` en `app.js`. Cada duración define los 3 pasos; el paso visual se calcula con `repeticiones × 20 s + cierre` y el de respiración con `ciclos × 10 s` (4 s + 6 s).
- **Proporciones para duraciones personalizadas**: array `REFERENCIAS` en `app.js`.
- **Reglas del agente**: `pausas-activas.md`.
- **Colores y tipografía**: variables en `:root` y `[data-tema="oscuro"]` dentro de `styles.css`.

## 🤝 Contribuir

1. Haz un fork y crea una rama (`git checkout -b mejora/pausa-7-min`).
2. Mantén el orden de los 3 pasos y la suma exacta de tiempos.
3. Actualiza `README.md` y `pausas-activas.md` si cambias las reglas.
4. Abre un Pull Request describiendo el cambio.

## 📄 Licencia

Distribuido bajo licencia [MIT](LICENSE).
