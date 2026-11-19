'use strict';

/* Reglas tomadas de pausas-activas.md:
   3 pasos (movimiento -> 20-20-20 -> respirar y soltar),
   tiempos que suman la duración pedida y versión Telegram de máximo 3 líneas. */

const CONFIG = {
  2: {
    movimiento: {
      min: 0.5,
      corto: 'Estira hombros y cuello',
      texto: 'Levántate. Sacude las manos, gira los hombros hacia atrás y estira el cuello con suavidad (oreja hacia hombro, sin forzar). Da unos pasos.'
    },
    visual: { min: 1, repeticiones: 2, cierre: 20 },
    respiracion: { min: 0.5, ciclos: 3 }
  },
  3: {
    movimiento: {
      min: 1,
      corto: 'Estira hombros y cuello',
      texto: 'Levántate. Sacude las manos, gira los hombros hacia atrás y estira el cuello con suavidad (oreja hacia hombro, sin forzar). Da unos pasos por la habitación.'
    },
    visual: { min: 1, repeticiones: 2, cierre: 20 },
    respiracion: { min: 1, ciclos: 6 }
  },
  4: {
    movimiento: {
      min: 1,
      corto: 'Estira hombros y cuello',
      texto: 'Levántate. Sacude las manos, gira los hombros hacia atrás y estira el cuello con suavidad (oreja hacia hombro, sin forzar). Da unos pasos.'
    },
    visual: { min: 1.5, repeticiones: 3, cierre: 30 },
    respiracion: { min: 1.5, ciclos: 9 }
  },
  5: {
    movimiento: {
      min: 1.5,
      corto: 'Camina y estira hombros/cuello',
      texto: 'Levántate. Sacude las manos, gira los hombros hacia atrás y estira el cuello con suavidad (oreja hacia hombro, sin forzar). Camina unos pasos, suelta los brazos y vuelve a sentarte despacio.'
    },
    visual: { min: 2, repeticiones: 4, cierre: 40 },
    respiracion: { min: 1.5, ciclos: 9 }
  },
  10: {
    movimiento: {
      min: 3,
      corto: 'Camina 3 min y estira hombros/cuello',
      texto: 'Sal a caminar si puedes: brazos sueltos, hombros girando hacia atrás y cuello estirado con suavidad. Sin pantalla y sin prisa, solo pasos.'
    },
    visual: { min: 4, repeticiones: 6, cierre: 120 },
    respiracion: { min: 3, ciclos: 18 }
  }
};

/* Proporciones de referencia (en unidades de 30 s) para interpolar
   cualquier duración personalizada entre 2 y 60 minutos. */
const REFERENCIAS = [
  { min: 2, mov: 1, vis: 2, resp: 1 },
  { min: 3, mov: 2, vis: 2, resp: 2 },
  { min: 4, mov: 2, vis: 3, resp: 3 },
  { min: 5, mov: 3, vis: 4, resp: 3 },
  { min: 10, mov: 6, vis: 8, resp: 6 }
];

const fmtMin = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
const fmtSeg = (s) => (s >= 60 ? `${fmtMin(s / 60)} min` : `${s} s`);
const fmtReloj = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const chips = document.querySelectorAll('.chip');
const generarBtn = document.getElementById('generar');
const sonidoCheck = document.getElementById('sonido');
const resultado = document.getElementById('resultado');
const titulo = document.getElementById('titulo-pausa');
const felicitacion = document.getElementById('felicitacion');
const pasosEl = document.getElementById('pasos');
const telegramTexto = document.getElementById('telegram-texto');
const copiarBtn = document.getElementById('copiar');
const estado = document.getElementById('timer-estado');
const cuenta = document.getElementById('timer-cuenta');
const barra = document.getElementById('barra');
const barraRelleno = document.getElementById('barra-relleno');
const iniciarBtn = document.getElementById('iniciar');
const detenerBtn = document.getElementById('detener');
const etiqueta = document.getElementById('etiqueta-duracion');
const customInput = document.getElementById('personalizada');
const aplicarBtn = document.getElementById('aplicar');
const errorDuracion = document.getElementById('error-duracion');
const temaBtn = document.getElementById('tema');

let minutosActuales = 4;
let pasosActuales = [];
let intervalo = null;
let enCurso = false;
let indice = 0;
let restante = 0;
let duracionPaso = 0;
let audio = null;
let copiarTimer = null;

function unidadesPersonalizadas(minutos) {
  let a = REFERENCIAS[0];
  let b = REFERENCIAS[1];

  for (let i = 0; i < REFERENCIAS.length - 1; i += 1) {
    if (minutos >= REFERENCIAS[i].min && minutos <= REFERENCIAS[i + 1].min) {
      a = REFERENCIAS[i];
      b = REFERENCIAS[i + 1];
      break;
    }
    if (minutos > REFERENCIAS[REFERENCIAS.length - 1].min) {
      a = REFERENCIAS[REFERENCIAS.length - 2];
      b = REFERENCIAS[REFERENCIAS.length - 1];
    }
  }

  const t = minutos <= a.min ? 0 : (minutos - a.min) / (b.min - a.min);
  let vis = Math.max(1, Math.round(a.vis + t * (b.vis - a.vis)));
  let resp = Math.max(1, Math.round(a.resp + t * (b.resp - a.resp)));
  let mov = Math.round(minutos * 2) - vis - resp;

  while (mov < 1 && resp > 1) { resp -= 1; mov += 1; }
  while (mov < 1 && vis > 1) { vis -= 1; mov += 1; }

  return { mov, vis, resp };
}

function configPersonalizada(minutos) {
  const u = unidadesPersonalizadas(minutos);
  const movSeg = u.mov * 30;
  const textoMov = movSeg <= 60
    ? 'Levántate. Sacude las manos, gira los hombros hacia atrás y estira el cuello con suavidad (oreja hacia hombro, sin forzar). Da unos pasos.'
    : movSeg <= 90
      ? 'Levántate. Sacude las manos, gira los hombros hacia atrás y estira el cuello con suavidad (oreja hacia hombro, sin forzar). Camina unos pasos, suelta los brazos y vuelve a sentarte despacio.'
      : 'Sal a caminar si puedes: brazos sueltos, hombros girando hacia atrás y cuello estirado con suavidad. Sin pantalla y sin prisa, solo pasos.';

  return {
    movimiento: {
      min: movSeg / 60,
      corto: movSeg <= 90 ? 'Estira hombros y cuello' : 'Camina y estira hombros/cuello',
      texto: textoMov
    },
    visual: { min: u.vis * 0.5, repeticiones: u.vis, cierre: u.vis * 10 },
    respiracion: { min: u.resp * 0.5, ciclos: u.resp * 3 }
  };
}

function construirPausa(minutos, c) {
  const pasos = [
    {
      titulo: 'Movimiento',
      min: c.movimiento.min,
      texto: c.movimiento.texto,
      corto: c.movimiento.corto
    },
    {
      titulo: 'Descanso visual',
      min: c.visual.min,
      texto: `Regla 20-20-20: mira algo a unos 6 m durante 20 s y parpadea despacio. Repite ${c.visual.repeticiones} veces (${c.visual.repeticiones * 20} s). Después cierra los ojos ${fmtSeg(c.visual.cierre)}.`,
      corto: `Mira a 6 m, 20 s + parpadea ×${c.visual.repeticiones} y ojos cerrados ${fmtSeg(c.visual.cierre)}`
    },
    {
      titulo: 'Respirar y soltar',
      min: c.respiracion.min,
      texto: `Inspira 4 s, espira 6 s (${c.respiracion.ciclos} ciclos). En cada espirada afloja mandíbula y hombros. Deja la cabeza en blanco un instante.`,
      corto: 'Respira 4-6 y suelta mandíbula y hombros'
    }
  ];

  const telegram = [
    `🧠 Pausa ${fmtMin(minutos)} min: ` +
      pasos.map((paso, i) => `${i + 1}) ${paso.corto}, ${fmtMin(paso.min)} min`).join('. ') + '.',
    '¡Te lo has ganado: vuelves con la cabeza fresca! 🌿'
  ].join('\n');

  return { pasos, telegram };
}

function resaltarPaso(i) {
  pasosEl.querySelectorAll('.paso').forEach((li, idx) => {
    li.classList.toggle('is-activo', idx === i);
  });
}

function reiniciarTimer() {
  clearInterval(intervalo);
  intervalo = null;
  enCurso = false;
  indice = 0;
  restante = 0;
  duracionPaso = 0;
  estado.textContent = 'Lista cuando tú quieras.';
  cuenta.textContent = '00:00';
  barraRelleno.style.width = '0%';
  barra.setAttribute('aria-valuenow', '0');
  iniciar.hidden = false;
  iniciar.textContent = 'Iniciar guía';
  detener.hidden = true;
  resaltarPaso(-1);
}

function detenerGuia(silencioso = false) {
  clearInterval(intervalo);
  intervalo = null;
  if (!enCurso) return;
  enCurso = false;
  if (!silencioso) {
    estado.textContent = 'Guía detenida. Puedes seguir cuando quieras.';
    iniciar.textContent = 'Empezar de nuevo';
  }
  detener.hidden = true;
  iniciar.hidden = false;
}

function generar() {
  detenerGuia(true);
  const config = CONFIG[minutosActuales] || configPersonalizada(minutosActuales);
  const { pasos, telegram } = construirPausa(minutosActuales, config);
  pasosActuales = pasos;

  titulo.textContent = `Tu pausa de ${fmtMin(minutosActuales)} minutos, en 3 pasos`;
  felicitacion.textContent = 'Te lo has ganado. Vuelve sin prisa: ya está más ligera. ✨';

  pasosEl.replaceChildren();
  pasos.forEach((paso, i) => {
    const li = document.createElement('li');
    li.className = 'paso';
    li.innerHTML =
      `<div class="paso-num" aria-hidden="true">${i + 1}</div>` +
      '<div class="paso-contenido"><h3></h3><p></p></div>';
    li.querySelector('h3').innerHTML =
      `${paso.titulo} <span class="duracion">${fmtMin(paso.min)} min</span>`;
    li.querySelector('p').textContent = paso.texto;
    pasosEl.appendChild(li);
  });

  telegramTexto.textContent = telegram;
  copiarBtn.textContent = 'Copiar';
  resultado.hidden = false;
  reiniciarTimer();
}

function seleccionar(minutos) {
  minutosActuales = minutos;
  chips.forEach((chip) => {
    const activo = Number(chip.dataset.min) === minutos;
    chip.classList.toggle('is-active', activo);
    chip.setAttribute('aria-pressed', String(activo));
  });
  etiqueta.textContent = `${fmtMin(minutos)} min`;
  customInput.value = String(minutos);
  errorDuracion.hidden = true;
  generar();
}

function aplicarPersonalizada() {
  const valor = Number(customInput.value);
  if (!Number.isFinite(valor) || valor < 2 || valor > 60) {
    errorDuracion.textContent = 'Escribe un valor entre 2 y 60 minutos.';
    errorDuracion.hidden = false;
    customInput.focus();
    return;
  }

  const minutos = Math.round(valor * 2) / 2;
  customInput.value = String(minutos);
  errorDuracion.hidden = true;
  minutosActuales = minutos;
  chips.forEach((chip) => {
    chip.classList.remove('is-active');
    chip.setAttribute('aria-pressed', 'false');
  });
  etiqueta.textContent = `${fmtMin(minutos)} min · personalizada`;
  generar();
}

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  const oscuro = tema === 'oscuro';
  temaBtn.textContent = oscuro ? '☀️' : '🌙';
  temaBtn.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  temaBtn.setAttribute('aria-pressed', String(oscuro));
  try { localStorage.setItem('pausa-tema', tema); } catch (_) { /* modo privado */ }
}

function inicializarTema() {
  let guardado = null;
  try { guardado = localStorage.getItem('pausa-tema'); } catch (_) { /* modo privado */ }
  const preferido = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'oscuro'
    : 'claro';
  aplicarTema(guardado || preferido);
}

function beep() {
  if (!sonidoCheck.checked) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.35);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.36);
  } catch (_) {
    // Audio no disponible: la guía sigue funcionando sin sonido.
  }
}

function actualizarProgreso() {
  const total = pasosActuales.reduce((sum, paso) => sum + Math.round(paso.min * 60), 0);
  const previos = pasosActuales
    .slice(0, indice)
    .reduce((sum, paso) => sum + Math.round(paso.min * 60), 0);
  const transcurrido = previos + (duracionPaso - restante);
  const pct = Math.min(100, Math.round((transcurrido / total) * 100));

  cuenta.textContent = fmtReloj(restante);
  barraRelleno.style.width = `${pct}%`;
  barra.setAttribute('aria-valuenow', String(pct));
}

function comenzarPaso() {
  if (indice >= pasosActuales.length) {
    finalizar();
    return;
  }
  duracionPaso = Math.round(pasosActuales[indice].min * 60);
  restante = duracionPaso;
  estado.textContent = `Paso ${indice + 1} de 3 · ${pasosActuales[indice].titulo}`;
  resaltarPaso(indice);
  actualizarProgreso();
  beep();
  clearInterval(intervalo);
  intervalo = setInterval(tick, 1000);
}

function tick() {
  restante -= 1;
  if (restante <= 0) {
    clearInterval(intervalo);
    intervalo = null;
    indice += 1;
    if (indice >= pasosActuales.length) finalizar();
    else comenzarPaso();
    return;
  }
  actualizarProgreso();
}

function iniciarGuia() {
  if (enCurso) return;
  enCurso = true;
  indice = 0;
  iniciar.hidden = true;
  detener.hidden = false;
  comenzarPaso();
}

function finalizar() {
  clearInterval(intervalo);
  intervalo = null;
  enCurso = false;
  estado.textContent = 'Listo. Vuelve sin prisa ✨';
  cuenta.textContent = '00:00';
  barraRelleno.style.width = '100%';
  barra.setAttribute('aria-valuenow', '100');
  resaltarPaso(-1);
  detener.hidden = true;
  iniciar.hidden = false;
  iniciar.textContent = 'Repetir guía';
  beep();
}

async function copiar() {
  const texto = telegramTexto.textContent;
  try {
    await navigator.clipboard.writeText(texto);
  } catch (_) {
    const area = document.createElement('textarea');
    area.value = texto;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  copiarBtn.textContent = '¡Copiado!';
  clearTimeout(copiarTimer);
  copiarTimer = setTimeout(() => { copiarBtn.textContent = 'Copiar'; }, 1800);
}

chips.forEach((chip) => chip.addEventListener('click', () => seleccionar(Number(chip.dataset.min))));
generarBtn.addEventListener('click', generar);
aplicarBtn.addEventListener('click', aplicarPersonalizada);
customInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') aplicarPersonalizada();
});
iniciarBtn.addEventListener('click', iniciarGuia);
detenerBtn.addEventListener('click', () => detenerGuia());
copiarBtn.addEventListener('click', copiar);
temaBtn.addEventListener('click', () => {
  aplicarTema(document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro');
});

inicializarTema();
seleccionar(4);
