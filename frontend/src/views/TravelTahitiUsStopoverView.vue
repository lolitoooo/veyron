<script setup lang="ts">
import { gsap } from 'gsap'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type Stage = 0 | 1 | 2 | 3
type ChecklistKey = 'passport' | 'esta' | 'luggage' | 'insurance' | 'flight'

/* ─── Route coordinates (great-circle approx Paris → SF → Papeete) ─── */
const ROUTE: [number, number][] = [
  [48.85,   2.35],   // 0  Paris
  [55,    -15],      // 1  NW Ireland
  [65,    -35],      // 2  Iceland area
  [68,    -52],      // 3  Greenland
  [63,    -68],      // 4  Hudson Strait
  [55,    -82],      // 5  James Bay
  [47,    -93],      // 6  Minnesota
  [42,   -110],      // 7  Wyoming
  [37.77,-122.42],   // 8  San Francisco  ← SF_INDEX
  [28,   -130],      // 9  Mid Pacific
  [18,   -138],      // 10 Near Hawaii
  [5,    -145],      // 11 Equator Pacific
  [-17.54,-149.56],  // 12 Papeete
]
const SF_IDX = 8
const TOTAL_SEG = ROUTE.length - 1 // 12

const ANIM_DURATION = 10

/* ─── State ─── */
const mapEl     = ref<HTMLDivElement | null>(null)
const currentStage  = ref<Stage>(0)
const hasStarted    = ref(false)
const isAnimating   = ref(false)

/* ─── Leaflet instances ─── */
let leafletMap:     L.Map       | null = null
let planeMarker:    L.Marker    | null = null
let trailLine:      L.Polyline  | null = null
let parisMarker:    L.Marker    | null = null
let sfMarker:       L.Marker    | null = null
let papeeteMarker:  L.Marker    | null = null
let activePopup:    L.Popup     | null = null

/* ─── GSAP ─── */
let tl: gsap.core.Timeline | null = null

/* ─── Waypoints data ─── */
const waypoints = [
  {
    stage: 1 as Stage,
    city: 'Paris, France',
    flag: '🇫🇷',
    latlng: [48.85, 2.35] as [number, number],
    popupText: 'Vérifiez votre passeport et soumettez l\'ESTA',
    info: 'Avant de décoller, votre passeport doit être valide au moins 6 mois après le retour. Soumettez votre demande ESTA au moins 72h avant le départ.',
    docs: ['Passeport valide 6 mois', 'ESTA approuvé'],
    actions: [{ label: "Demander l'ESTA", url: 'https://esta.cbp.dhs.gov' }],
  },
  {
    stage: 2 as Stage,
    city: 'San Francisco, USA',
    flag: '🇺🇸',
    latlng: [37.77, -122.42] as [number, number],
    popupText: 'Passage obligatoire par l\'immigration US',
    info: 'Escale aux USA : passage par l\'immigration même en transit. Prévoyez minimum 3h de correspondance. L\'ESTA est indispensable.',
    docs: ['ESTA validé', 'Immigration US passée'],
    actions: [{ label: 'Infos Ambassade US', url: 'https://fr.usembassy.gov' }],
  },
  {
    stage: 3 as Stage,
    city: 'Papeete, Tahiti',
    flag: '🌺',
    latlng: [-17.54, -149.56] as [number, number],
    popupText: 'Bienvenue en Polynésie française !',
    info: 'Entrée libre pour les ressortissants français. Votre passeport seul suffit, aucun visa requis pour la Polynésie française.',
    docs: ['Passeport tamponné', 'Formulaire arrivée PPT'],
    actions: [{ label: 'Aéroport PPT', url: 'https://www.tahiti-aeroport.pf' }],
  },
]

const currentWaypoint = computed(() => waypoints.find(w => w.stage === currentStage.value) ?? null)

/* ─── Checklist ─── */
const checklist = ref<Array<{ key: ChecklistKey; label: string; done: boolean; stageRequired: Stage }>>([
  { key: 'passport', label: 'Passeport valide (6 mois minimum)', done: false, stageRequired: 1 },
  { key: 'esta',     label: 'ESTA soumis (72h avant le départ)',  done: false, stageRequired: 1 },
  { key: 'luggage',  label: 'Bagages préparés et pesés',          done: false, stageRequired: 2 },
  { key: 'insurance',label: 'Assurance voyage souscrite',         done: false, stageRequired: 2 },
  { key: 'flight',   label: 'Billets confirmés (toutes étapes)',  done: false, stageRequired: 3 },
])

const STORAGE_KEY = 'travel-tahiti-v4'

function loadChecklist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as Partial<Record<ChecklistKey, boolean>>
    checklist.value = checklist.value.map(i => ({ ...i, done: saved[i.key] ?? i.done }))
  } catch { /* no-op */ }
}

function saveChecklist() {
  try {
    const data: Record<string, boolean> = {}
    checklist.value.forEach(i => { data[i.key] = i.done })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* no-op */ }
}

function toggleChecklist(key: ChecklistKey) {
  const item = checklist.value.find(i => i.key === key)
  if (item) { item.done = !item.done; saveChecklist() }
}

function syncChecklist(stage: Stage) {
  checklist.value = checklist.value.map(i => ({ ...i, done: i.stageRequired <= stage ? true : i.done }))
  saveChecklist()
}

/* ─── Helpers ─── */
function calcBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => d * Math.PI / 180
  const φ1 = toRad(lat1), φ2 = toRad(lat2)
  const Δλ = toRad(lon2 - lon1)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

function cityIcon(name: string, active = false) {
  const dot = active
    ? `background:#c9a961;border:2px solid #fff;box-shadow:0 0 0 3px rgba(201,169,97,0.3);`
    : `background:#fff;border:2px solid #c9a961;`
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      <div style="width:14px;height:14px;border-radius:50%;${dot}box-shadow:0 2px 6px rgba(0,0,0,0.25);"></div>
      <div style="font:600 11px/1 'Montserrat',sans-serif;color:#1a1a1a;white-space:nowrap;background:rgba(255,255,255,0.95);padding:3px 8px;border-radius:4px;box-shadow:0 1px 5px rgba(0,0,0,0.18);letter-spacing:.05em;">${name}</div>
    </div>`,
    className: '',
    iconSize: [90, 38],
    iconAnchor: [45, 7],
  })
}

const planeIconHtml = `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
  <svg class="tv-plane-svg" viewBox="0 0 24 24" width="30" height="30" style="transform-origin:center;transition:transform .15s linear;filter:drop-shadow(0 2px 6px rgba(201,169,97,.7));">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#c9a961"/>
  </svg>
</div>`

function setPlaneRotation(bearing: number) {
  const svgEl = planeMarker?.getElement()?.querySelector('.tv-plane-svg') as HTMLElement | null
  if (svgEl) svgEl.style.transform = `rotate(${bearing}deg)`
}

function setStage(stage: Stage) {
  currentStage.value = stage
  if (stage <= 0) return
  syncChecklist(stage)

  const wp = waypoints.find(w => w.stage === stage)
  if (!wp || !leafletMap) return

  // Update city marker icons
  parisMarker?.setIcon(cityIcon('Paris', currentStage.value >= 1))
  sfMarker?.setIcon(cityIcon('San Francisco', currentStage.value >= 2))
  papeeteMarker?.setIcon(cityIcon('Papeete', currentStage.value >= 3))

  // Open popup on map
  if (activePopup) leafletMap.closePopup(activePopup)
  activePopup = L.popup({ closeButton: false, className: 'tv-map-popup', maxWidth: 220 })
    .setLatLng(wp.latlng)
    .setContent(`
      <div style="font-family:'Montserrat',sans-serif;padding:4px 2px;">
        <p style="font:600 13px/1.4 'Cormorant Garamond',serif;color:#1a1a1a;margin:0 0 4px;">${wp.flag} ${wp.city}</p>
        <p style="font-size:12px;color:#4a4a4a;margin:0;line-height:1.5;">${wp.popupText}</p>
      </div>`)
    .openOn(leafletMap)
}

/* ─── Map init ─── */
function buildMap() {
  if (!mapEl.value) return

  leafletMap = L.map(mapEl.value, {
    scrollWheelZoom: false,
    zoomControl: true,
    attributionControl: true,
  })

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 18,
  }).addTo(leafletMap)

  // Fit to show full route
  leafletMap.fitBounds([[-25, -158], [72, 15]], { padding: [30, 30] })

  // Dashed full-route preview
  L.polyline(ROUTE, {
    color: 'rgba(201,169,97,0.35)',
    weight: 2,
    dashArray: '7 5',
    lineCap: 'round',
  }).addTo(leafletMap)

  // Animated trail (grows as plane moves)
  trailLine = L.polyline([], {
    color: '#c9a961',
    weight: 2.5,
    lineCap: 'round',
  }).addTo(leafletMap)

  // City markers
  parisMarker   = L.marker([48.85, 2.35],      { icon: cityIcon('Paris'),         zIndexOffset: 100 }).addTo(leafletMap)
  sfMarker      = L.marker([37.77, -122.42],   { icon: cityIcon('San Francisco'), zIndexOffset: 100 }).addTo(leafletMap)
  papeeteMarker = L.marker([-17.54, -149.56],  { icon: cityIcon('Papeete'),       zIndexOffset: 100 }).addTo(leafletMap)

  // Plane marker (starts at Paris, hidden until journey starts)
  planeMarker = L.marker([48.85, 2.35], {
    icon: L.divIcon({ html: planeIconHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 18] }),
    zIndexOffset: 1000,
  }).addTo(leafletMap)

  // Initial bearing: Paris → next point
  const initBearing = calcBearing(ROUTE[0][0], ROUTE[0][1], ROUTE[1][0], ROUTE[1][1])
  setPlaneRotation(initBearing)
}

/* ─── GSAP animation ─── */
function buildTimeline() {
  const progress = { value: 0 }

  tl = gsap.timeline({
    paused: true,
    onUpdate: () => {
      if (!planeMarker || !trailLine) return
      const v = progress.value
      const exactIdx = v * TOTAL_SEG
      const lo = Math.floor(exactIdx)
      const hi = Math.min(lo + 1, TOTAL_SEG)
      const t = exactIdx - lo

      // Interpolate position
      const lat = ROUTE[lo][0] + t * (ROUTE[hi][0] - ROUTE[lo][0])
      const lng = ROUTE[lo][1] + t * (ROUTE[hi][1] - ROUTE[lo][1])
      planeMarker.setLatLng([lat, lng])

      // Bearing for plane rotation
      if (lo < TOTAL_SEG) {
        const b = calcBearing(ROUTE[lo][0], ROUTE[lo][1], ROUTE[hi][0], ROUTE[hi][1])
        setPlaneRotation(b)
      }

      // Grow trail
      const visited: [number, number][] = ROUTE.slice(0, lo + 1) as [number, number][]
      visited.push([lat, lng])
      trailLine.setLatLngs(visited)
    },
    onComplete: () => { isAnimating.value = false },
  })

  tl.to(progress, { value: 1, duration: ANIM_DURATION, ease: 'none' }, 0)
    .call(() => setStage(1), [], 0.05)
    .call(() => setStage(2), [], ANIM_DURATION * (SF_IDX / TOTAL_SEG) - 0.1)
    .call(() => setStage(3), [], ANIM_DURATION * 0.97)
}

function startJourney() {
  if (isAnimating.value) return
  isAnimating.value = true
  hasStarted.value = true
  currentStage.value = 0
  checklist.value = checklist.value.map(i => ({ ...i, done: false }))
  if (trailLine) trailLine.setLatLngs([])
  if (activePopup && leafletMap) leafletMap.closePopup(activePopup)
  // Reset city icons
  parisMarker?.setIcon(cityIcon('Paris'))
  sfMarker?.setIcon(cityIcon('San Francisco'))
  papeeteMarker?.setIcon(cityIcon('Papeete'))
  tl?.restart()
}

function resetJourney() {
  tl?.pause(0)
  isAnimating.value = false
  hasStarted.value = false
  currentStage.value = 0
  if (trailLine) trailLine.setLatLngs([])
  if (activePopup && leafletMap) leafletMap.closePopup(activePopup)
  planeMarker?.setLatLng([48.85, 2.35])
  setPlaneRotation(calcBearing(ROUTE[0][0], ROUTE[0][1], ROUTE[1][0], ROUTE[1][1]))
  parisMarker?.setIcon(cityIcon('Paris'))
  sfMarker?.setIcon(cityIcon('San Francisco'))
  papeeteMarker?.setIcon(cityIcon('Papeete'))
  loadChecklist()
}

/* ─── Recap steps (replaces flat checklist) ─── */
const recapSteps = [
  {
    stage: 1 as Stage,
    flag: '🇫🇷',
    city: 'Paris',
    when: 'Avant le départ',
    color: '#1a6fa8',
    info: "Votre passeport doit être valide au moins 6 mois après la date de retour. L'ESTA doit être approuvé avant l'embarquement — ne l'attendez pas au dernier moment.",
    tasks: [
      { key: 'passport' as ChecklistKey, label: 'Passeport valide (6 mois après le retour)' },
      { key: 'esta',     label: 'ESTA approuvé (déposer 72h avant)' } as { key: ChecklistKey; label: string },
    ],
    tips: [
      "L'ESTA est valable 2 ans, utilisable pour plusieurs voyages",
      'Vérifier que le nom sur le billet correspond exactement au passeport',
      'Photographiez vos documents avant de partir',
    ],
    actions: [{ label: "Demander l'ESTA", url: 'https://esta.cbp.dhs.gov' }],
  },
  {
    stage: 2 as Stage,
    flag: '🇺🇸',
    city: 'San Francisco',
    when: 'À l\'escale – Transit',
    color: '#8b4513',
    info: 'Même en transit, vous devez passer par l\'immigration américaine. Récupérez vos bagages, passez le contrôle, puis re-enregistrez-les. Prévoir impérativement 3h minimum.',
    tasks: [
      { key: 'luggage',  label: 'Bagages préparés et dans les limites autorisées' } as { key: ChecklistKey; label: string },
      { key: 'insurance',label: 'Assurance voyage souscrite (rapatriement inclus)' } as { key: ChecklistKey; label: string },
    ],
    tips: [
      'Récupérer les bagages + re-enregistrer après l\'immigration',
      'Avoir l\'adresse d\'hébergement US à renseigner sur le formulaire I-94',
      'Prévenir votre banque de l\'escale aux USA pour éviter le blocage carte',
    ],
    actions: [{ label: 'Infos Ambassade US', url: 'https://fr.usembassy.gov' }],
  },
  {
    stage: 3 as Stage,
    flag: '🌺',
    city: 'Papeete',
    when: 'À l\'arrivée – PPT',
    color: '#2d7a4f',
    info: "Entrée libre pour les ressortissants français — la Polynésie française est un territoire d'outre-mer. Votre passeport français suffit, aucun visa requis.",
    tasks: [
      { key: 'flight',   label: 'Tous les billets confirmés (Paris → SF → PPT)' } as { key: ChecklistKey; label: string },
    ],
    tips: [
      "Pensez à avoir un justificatif d'hébergement ou d'invitation",
      'Monnaie locale : Franc Pacifique (XPF) — les CB sont acceptées',
      'Prévoir anti-moustiques et crème solaire indice élevé',
    ],
    actions: [{ label: 'Aéroport PPT', url: 'https://www.tahiti-aeroport.pf' }],
  },
]

/* ─── Helper to read checklist done state by key ─── */
const checklistMap = computed(() => {
  const m: Partial<Record<ChecklistKey, boolean>> = {}
  checklist.value.forEach(i => { m[i.key] = i.done })
  return m
})

const officialLinks = [
  { title: 'ESTA',             url: 'https://esta.cbp.dhs.gov',    badge: 'ESTA', note: 'Demande officielle, résultat sous 72h.' },
  { title: 'Ambassade USA',    url: 'https://fr.usembassy.gov',    badge: 'US',   note: 'Consulat et informations transit.' },
  { title: 'Aéroport PPT',    url: 'https://www.tahiti-aeroport.pf', badge: 'PPT', note: 'Vols, correspondances, services.' },
  { title: 'Service-public.fr',url: 'https://www.service-public.fr',badge: 'SP',  note: 'Formalités administratives.' },
]

/* ─── Hero text lines for GSAP char animation ─── */
const heroLines = ['VOYAGE', 'VERS', 'TAHITI']

function animateHeroText() {
  const chars = document.querySelectorAll<HTMLElement>('.tv-char')
  const sub   = document.querySelector<HTMLElement>('.tv-hero-sub')
  const ctas  = document.querySelector<HTMLElement>('.tv-hero-ctas')

  if (!chars.length) return

  const ctx = gsap.context(() => {
    // Characters: slide up from behind clip mask
    gsap.fromTo(
      chars,
      { y: '105%' },
      {
        y: '0%',
        duration: 1,
        stagger: { each: 0.05, from: 'start' },
        ease: 'power4.out',
        delay: 0.1,
      },
    )
    // Subtitle + CTAs fade in after text
    if (sub)  gsap.fromTo(sub,  { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 1.1 })
    if (ctas) gsap.fromTo(ctas, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 1.35 })
  })
  return ctx
}

onMounted(() => {
  loadChecklist()
  animateHeroText()
  buildMap()
  setTimeout(buildTimeline, 400)
})

onBeforeUnmount(() => {
  tl?.kill()
  leafletMap?.remove()
})
</script>

<template>
  <div class="tv">

    <!-- ═══════════════════ HERO ═══════════════════ -->
    <section class="tv-hero">
      <div class="tv-hero-inner">

        <!-- Animated title -->
        <h1 class="tv-hero-words" aria-label="Voyage vers Tahiti">
          <span
            v-for="(word, wi) in heroLines"
            :key="wi"
            class="tv-hero-line"
            :class="{ 'tv-hero-line--accent': wi === 2 }"
          >
            <span
              v-for="(char, ci) in word.split('')"
              :key="`${wi}-${ci}`"
              class="tv-char-mask"
            >
              <span class="tv-char">{{ char }}</span>
            </span>
          </span>
        </h1>

        <!-- Sub + CTA (fade in after letters) -->
        <p class="tv-hero-sub" style="opacity:0">
          Polynésie 2026 · Une escale aux USA, puis direction Papeete
        </p>
        <div class="tv-hero-ctas" style="opacity:0">
          <button
            type="button"
            class="tv-btn-primary"
            :disabled="isAnimating"
            @click="startJourney"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
            </svg>
            Commencer le trajet
          </button>
          <a href="#checklist" class="tv-btn-secondary">Voir la checklist</a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════ MAP SECTION ═══════════════════ -->
    <section class="tv-map-section">
      <div class="tv-inner tv-map-header">
        <p class="tv-overline">Trajet interactif</p>
        <h2 class="tv-section-title">Paris → San Francisco → Tahiti</h2>
        <p class="tv-section-sub">
          Lancez l'animation pour suivre l'avion sur la carte. Les infos s'affichent à chaque escale.
        </p>
      </div>

      <!-- Full-width map -->
      <div class="tv-map-area">
        <div ref="mapEl" class="tv-leaflet-map" />

        <!-- Overlay before start -->
        <Transition name="tv-fade">
          <div v-if="!hasStarted" class="tv-map-overlay">
            <button type="button" class="tv-btn-primary tv-start-btn" @click="startJourney">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
              </svg>
              Commencer le trajet
            </button>
            <p class="tv-overlay-hint">Cliquez pour lancer l'animation</p>
          </div>
        </Transition>
      </div>

      <!-- Route progress steps + info card -->
      <div class="tv-inner tv-map-bottom">

        <!-- 3-step progress indicator -->
        <div class="tv-steps" aria-label="Étapes du trajet">
          <div
            v-for="(wp, i) in waypoints"
            :key="wp.stage"
            class="tv-step"
            :class="{ 'tv-step--done': currentStage >= wp.stage, 'tv-step--active': currentStage === wp.stage }"
          >
            <div class="tv-step-connector" v-if="i > 0" />
            <div class="tv-step-node">
              <span class="tv-step-num">{{ wp.stage }}</span>
            </div>
            <div class="tv-step-meta">
              <span class="tv-step-flag">{{ wp.flag }}</span>
              <span class="tv-step-city">{{ wp.city }}</span>
            </div>
          </div>
        </div>

        <!-- Info card (updates at each waypoint) -->
        <Transition name="tv-slide" mode="out-in">
          <div v-if="currentWaypoint" :key="currentStage" class="tv-info-card">
            <div class="tv-info-card-header">
              <span class="tv-info-flag">{{ currentWaypoint.flag }}</span>
              <div>
                <p class="tv-info-stage">Étape {{ currentStage }}/3</p>
                <h3 class="tv-info-city">{{ currentWaypoint.city }}</h3>
              </div>
            </div>
            <p class="tv-info-body">{{ currentWaypoint.info }}</p>
            <ul class="tv-info-docs">
              <li v-for="doc in currentWaypoint.docs" :key="doc" class="tv-info-doc">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M 2,7 L 5.5,10.5 L 12,3" stroke="#c9a961" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ doc }}
              </li>
            </ul>
            <div class="tv-info-actions">
              <a
                v-for="action in currentWaypoint.actions"
                :key="action.url"
                :href="action.url"
                target="_blank"
                rel="noreferrer noopener"
                class="tv-btn-gold"
              >{{ action.label }}</a>
            </div>
          </div>
          <div v-else key="empty" class="tv-info-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="rgba(201,169,97,0.5)"/>
            </svg>
            <p>Lancez le trajet pour afficher les informations de chaque escale.</p>
          </div>
        </Transition>

        <!-- Replay -->
        <div v-if="hasStarted && !isAnimating" class="tv-replay-row">
          <button type="button" class="tv-btn-ghost" @click="resetJourney">
            Rejouer le trajet
          </button>
        </div>
      </div>
    </section>

    <!-- ═══════════════════ RECAP ÉTAPES ═══════════════════ -->
    <section id="checklist" class="tv-recap-section">
      <div class="tv-inner">
        <header class="tv-section-header">
          <p class="tv-overline">Récapitulatif du voyage</p>
          <h2 class="tv-section-title">Ce qu'il faut faire à chaque étape</h2>
          <p class="tv-section-sub">Cochez chaque item au fur et à mesure. Se cochent aussi automatiquement pendant l'animation.</p>
        </header>

        <div class="tv-recap-grid">
          <article
            v-for="step in recapSteps"
            :key="step.stage"
            class="tv-recap-card"
            :class="{ 'tv-recap-card--complete': step.tasks.every(t => checklistMap[t.key]) }"
          >
            <!-- Card header -->
            <div class="tv-recap-card-top" :style="{ '--step-color': step.color }">
              <span class="tv-recap-num">{{ step.stage }}</span>
              <div class="tv-recap-title-block">
                <span class="tv-recap-when">{{ step.when }}</span>
                <h3 class="tv-recap-city">
                  <span aria-hidden="true">{{ step.flag }}</span> {{ step.city }}
                </h3>
              </div>
              <!-- Progress ring -->
              <div class="tv-recap-progress" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="2.5"/>
                  <circle
                    cx="20" cy="20" r="16"
                    fill="none"
                    stroke="var(--step-color)"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-dasharray="100.5"
                    :stroke-dashoffset="100.5 - (step.tasks.filter(t => checklistMap[t.key]).length / step.tasks.length) * 100.5"
                    style="transform: rotate(-90deg); transform-origin: center; transition: stroke-dashoffset .5s ease"
                  />
                  <text x="20" y="24" text-anchor="middle" font-size="11" font-weight="700" :fill="step.color" font-family="Montserrat,sans-serif">
                    {{ step.tasks.filter(t => checklistMap[t.key]).length }}/{{ step.tasks.length }}
                  </text>
                </svg>
              </div>
            </div>

            <!-- Description -->
            <p class="tv-recap-info">{{ step.info }}</p>

            <!-- Interactive checklist tasks -->
            <ul class="tv-recap-tasks">
              <li
                v-for="task in step.tasks"
                :key="task.key"
                class="tv-recap-task"
                :class="{ 'tv-recap-task--done': checklistMap[task.key] }"
              >
                <label class="tv-recap-task-label">
                  <input
                    type="checkbox"
                    class="tv-sr-only"
                    :checked="checklistMap[task.key]"
                    @change="toggleChecklist(task.key)"
                    :aria-label="task.label"
                  />
                  <span class="tv-recap-check" aria-hidden="true">
                    <svg width="10" height="8" viewBox="0 0 10 8">
                      <path d="M 1,4 L 3.5,6.5 L 9,1" fill="none" stroke="currentColor"
                        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                        class="tv-recap-tick"
                      />
                    </svg>
                  </span>
                  <span class="tv-recap-task-text">{{ task.label }}</span>
                </label>
              </li>
            </ul>

            <!-- Tips -->
            <div class="tv-recap-tips">
              <p class="tv-recap-tips-heading">À retenir</p>
              <ul class="tv-recap-tips-list">
                <li v-for="tip in step.tips" :key="tip">{{ tip }}</li>
              </ul>
            </div>

            <!-- Action links -->
            <div class="tv-recap-actions">
              <a
                v-for="action in step.actions"
                :key="action.url"
                :href="action.url"
                target="_blank"
                rel="noreferrer noopener"
                class="tv-btn-gold tv-recap-action-btn"
              >{{ action.label }}</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ═══════════════════ LINKS ═══════════════════ -->
    <section class="tv-links-section">
      <div class="tv-inner">
        <header class="tv-section-header">
          <p class="tv-overline">Références officielles</p>
          <h2 class="tv-section-title">Liens utiles</h2>
        </header>

        <div class="tv-links-grid">
          <a
            v-for="link in officialLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noreferrer noopener"
            class="tv-link-card"
          >
            <span class="tv-link-badge">{{ link.badge }}</span>
            <div class="tv-link-body">
              <h3 class="tv-link-name">{{ link.title }}</h3>
              <p class="tv-link-note">{{ link.note }}</p>
            </div>
            <svg class="tv-link-arrow" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M 3,8 L 13,8 M 9,4 L 13,8 L 9,12" stroke="#c9a961" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════ FOOTER ═══════════════════ -->
    <footer class="tv-footer">
      <div class="tv-inner">
        <div class="tv-footer-grid">
          <div>
            <h3 class="tv-footer-heading">Rappels essentiels</h3>
            <ul class="tv-footer-list">
              <li>Passeport valide 6 mois après le retour</li>
              <li>ESTA : demande minimum 72h avant</li>
              <li>Prévoir au moins 3h de transit à San Francisco</li>
              <li>Carte d'embarquement pour chaque vol séparé</li>
              <li>Entrée libre en Polynésie française (passeport seul)</li>
            </ul>
          </div>
          <div>
            <h3 class="tv-footer-heading">Groupe &amp; Contact</h3>
            <a
              href="https://wa.me/0000000000"
              target="_blank"
              rel="noreferrer noopener"
              class="tv-whatsapp-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.9.52 3.68 1.42 5.21L2 22l4.91-1.38A9.93 9.93 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.12 13.66c-.22.62-1.28 1.16-1.76 1.23-.48.07-1.06.1-1.7-.11a16.1 16.1 0 0 1-1.55-.58 12.25 12.25 0 0 1-4.2-3.72c-.44-.6-.88-1.6-.88-2.66 0-1.06.54-1.58 1.04-2.04.22-.22.48-.33.68-.33.2 0 .36.002.52.008.18.006.4-.068.62.48.22.55.74 1.8.8 1.93.07.13.11.29.02.46-.08.17-.12.28-.24.43-.12.15-.25.34-.36.46-.12.13-.24.27-.1.52.14.25.62 1.03 1.34 1.66.9.8 1.66 1.07 1.93 1.18.27.11.43.09.58-.06.15-.15.64-.74.81-1 .17-.25.34-.21.58-.12.24.09 1.52.72 1.78.85.26.13.44.19.5.3.06.11.06.66-.16 1.27z" fill="#25D366"/>
              </svg>
              Rejoindre le groupe WhatsApp
            </a>
            <p class="tv-footer-note">
              Cette page regroupe les informations essentielles pour le voyage.<br />
              Tous les liens renvoient vers des sites officiels.
            </p>
          </div>
        </div>
        <!-- SIM locale -->
        <div class="tv-sim-row">
          <div class="tv-sim-info">
            <span class="tv-sim-label">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style="vertical-align:-2px;margin-right:6px;">
                <path d="M17 2H7L4 5v14l3 3h10l3-3V5l-3-3zM12 19a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm4-8H8V6h8v5z" fill="currentColor"/>
              </svg>
              SIM locale en Polynésie
            </span>
            <span class="tv-sim-text">
              Pensez à acheter une SIM locale à l'aéroport ou en ville pour éviter les frais de roaming.
            </span>
          </div>
          <div class="tv-sim-operators">
            <a href="https://www.vini.pf" target="_blank" rel="noreferrer noopener" class="tv-sim-op">
              Vini <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><path d="M2,6 L10,6 M7,3 L10,6 L7,9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
            <a href="https://www.vodafone.pf" target="_blank" rel="noreferrer noopener" class="tv-sim-op">
              Vodafone PF <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><path d="M2,6 L10,6 M7,3 L10,6 L7,9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </div>
        </div>

        <div class="tv-footer-divider" />
        <p class="tv-footer-credits">Voyage Tahiti 2026 · Page informative · Liens officiels uniquement</p>
      </div>
    </footer>
  </div>
</template>

<!-- Global styles for Leaflet dynamic DOM elements -->
<style>
.tv-map-popup .leaflet-popup-content-wrapper {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border: 1px solid rgba(201,169,97,0.25);
  padding: 0;
}
.tv-map-popup .leaflet-popup-content {
  margin: 12px 16px;
}
.tv-map-popup .leaflet-popup-tip {
  background: white;
}
.leaflet-control-zoom a {
  font-family: 'Montserrat', sans-serif !important;
}
</style>

<style scoped>
/* ══════════════════════════════════════
   BASE — full width, site background
══════════════════════════════════════ */
.tv {
  width: 100%;
  background: var(--color-white, #fff);
  color: var(--color-primary, #1a1a1a);
  font-family: var(--font-secondary, 'Montserrat', sans-serif);
}

/* Inner container (replaces .container for this page) */
.tv-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
}

@media (max-width: 768px) {
  .tv-inner { padding: 0 20px; }
}

/* ══════════════════════════════════════
   HERO — full-width cinematic text
══════════════════════════════════════ */
.tv-hero {
  background: var(--color-off-white, #fafaf8);
  min-height: 72vh;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--color-gray-200, #e8e8e8);
  overflow: hidden;
}

.tv-hero-inner {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 72px 40px 64px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Title: 3 stacked lines */
.tv-hero-words {
  margin: 0;
  line-height: 0.92;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tv-hero-line {
  display: block;
  font-family: var(--font-primary, 'Cormorant Garamond', serif);
  font-size: clamp(4.5rem, 12vw, 11rem);
  font-weight: 300;
  color: var(--color-primary, #1a1a1a);
  letter-spacing: -0.01em;
  text-transform: uppercase;
}

/* Last word: gold accent */
.tv-hero-line--accent {
  color: var(--color-secondary, #c9a961);
}

/* Each character is masked so it slides up */
.tv-char-mask {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
  /* slight letter-spacing between chars */
  margin-right: 0.02em;
}

.tv-char {
  display: inline-block;
  /* initial state set by GSAP (y: 105%) */
}

.tv-hero-sub {
  font-size: clamp(0.9rem, 1.6vw, 1rem);
  color: var(--color-gray-500, #6b6b6b);
  line-height: 1.65;
  max-width: 560px;
  margin: 0;
  letter-spacing: 0.04em;
}

.tv-hero-ctas {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

/* ══════════════════════════════════════
   BUTTONS
══════════════════════════════════════ */
.tv-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--color-primary, #1a1a1a);
  color: #fff;
  border: 1px solid var(--color-primary, #1a1a1a);
  border-radius: 3px;
  padding: 13px 28px;
  font-family: var(--font-secondary, sans-serif);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.25s, transform 0.2s, box-shadow 0.25s;
  text-decoration: none;
}

.tv-btn-primary:hover:not(:disabled) {
  background: #2d2d2d;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.18);
}

.tv-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.tv-btn-secondary {
  display: inline-flex;
  align-items: center;
  background: transparent;
  color: var(--color-primary, #1a1a1a);
  border: 1px solid var(--color-gray-300, #d4d4d4);
  border-radius: 3px;
  padding: 13px 28px;
  font-family: var(--font-secondary, sans-serif);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.25s, background 0.25s;
}

.tv-btn-secondary:hover {
  border-color: var(--color-primary, #1a1a1a);
  background: var(--color-gray-100, #f8f8f8);
}

.tv-btn-gold {
  display: inline-block;
  background: var(--color-secondary, #c9a961);
  color: #fff;
  border: none;
  border-radius: 3px;
  padding: 10px 20px;
  font-family: var(--font-secondary, sans-serif);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.25s, transform 0.2s;
}

.tv-btn-gold:hover { background: #b8953a; transform: translateY(-1px); }

.tv-btn-ghost {
  background: transparent;
  color: var(--color-gray-600, #4a4a4a);
  border: 1px solid var(--color-gray-300, #d4d4d4);
  border-radius: 3px;
  padding: 10px 20px;
  font-family: var(--font-secondary, sans-serif);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 0.25s, color 0.25s;
}

.tv-btn-ghost:hover {
  border-color: var(--color-primary, #1a1a1a);
  color: var(--color-primary, #1a1a1a);
}

/* ══════════════════════════════════════
   SHARED SECTION STYLES
══════════════════════════════════════ */
.tv-section-header { text-align: center; margin-bottom: 40px; }

.tv-overline {
  font-size: 10px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-secondary, #c9a961);
  margin: 0 0 10px;
}

.tv-section-title {
  font-family: var(--font-primary, 'Cormorant Garamond', serif);
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  font-weight: 300;
  color: var(--color-primary, #1a1a1a);
  margin: 0 0 12px;
  letter-spacing: 0.01em;
}

.tv-section-sub {
  font-size: 14px;
  color: var(--color-gray-500, #6b6b6b);
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.65;
}

/* ══════════════════════════════════════
   MAP SECTION
══════════════════════════════════════ */
.tv-map-section {
  padding: 72px 0 0;
  background: var(--color-white, #fff);
}

.tv-map-header { margin-bottom: 32px; }

/* Full-width map container */
.tv-map-area {
  position: relative;
  width: 100%;
  height: 58vh;
  min-height: 360px;
  border-top: 1px solid var(--color-gray-200, #e8e8e8);
  border-bottom: 1px solid var(--color-gray-200, #e8e8e8);
}

.tv-leaflet-map {
  width: 100%;
  height: 100%;
}

/* Overlay before start */
.tv-map-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(4px);
}

.tv-start-btn { font-size: 13px; padding: 15px 36px; }

.tv-overlay-hint {
  font-size: 12px;
  color: var(--color-gray-500, #6b6b6b);
  letter-spacing: 0.06em;
  margin: 0;
}

/* Overlay transition */
.tv-fade-enter-active, .tv-fade-leave-active { transition: opacity 0.4s ease; }
.tv-fade-enter-from, .tv-fade-leave-to { opacity: 0; }

/* ─── Steps + info below map ─── */
.tv-map-bottom {
  padding: 36px 40px 48px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* 3-step progress */
.tv-steps {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.tv-step {
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.tv-step-connector {
  position: absolute;
  top: 18px;
  right: 50%;
  left: calc(-50% + 18px);
  height: 2px;
  background: var(--color-gray-200, #e8e8e8);
  transition: background 0.4s ease;
}

.tv-step--done .tv-step-connector,
.tv-step--active .tv-step-connector {
  background: var(--color-secondary, #c9a961);
}

.tv-step-node {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--color-gray-300, #d4d4d4);
  background: var(--color-white, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: all 0.35s ease;
}

.tv-step--done .tv-step-node {
  border-color: var(--color-secondary, #c9a961);
  background: var(--color-secondary, #c9a961);
}

.tv-step--active .tv-step-node {
  border-color: var(--color-secondary, #c9a961);
  background: var(--color-secondary, #c9a961);
  box-shadow: 0 0 0 6px rgba(201,169,97,0.15);
}

.tv-step-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-gray-400, #a0a0a0);
  transition: color 0.35s;
}

.tv-step--done .tv-step-num,
.tv-step--active .tv-step-num {
  color: #fff;
}

.tv-step-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.tv-step-flag { font-size: 1.1rem; }

.tv-step-city {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-gray-500, #6b6b6b);
  text-align: center;
  white-space: nowrap;
  transition: color 0.35s;
}

.tv-step--active .tv-step-city,
.tv-step--done .tv-step-city {
  color: var(--color-primary, #1a1a1a);
  font-weight: 600;
}

/* Info card */
.tv-info-card {
  background: var(--color-off-white, #fafaf8);
  border: 1px solid var(--color-gray-200, #e8e8e8);
  border-left: 3px solid var(--color-secondary, #c9a961);
  border-radius: 8px;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 720px;
}

.tv-info-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.tv-info-flag { font-size: 1.8rem; line-height: 1; }

.tv-info-stage {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-gray-400, #a0a0a0);
  margin: 0 0 3px;
}

.tv-info-city {
  font-family: var(--font-primary, 'Cormorant Garamond', serif);
  font-size: 1.4rem;
  font-weight: 400;
  color: var(--color-primary, #1a1a1a);
  margin: 0;
}

.tv-info-body {
  font-size: 13.5px;
  color: var(--color-gray-600, #4a4a4a);
  line-height: 1.7;
  margin: 0;
}

.tv-info-docs {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.tv-info-doc {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-primary, #1a1a1a);
  font-weight: 500;
}

.tv-info-actions { display: flex; gap: 10px; flex-wrap: wrap; }

.tv-info-placeholder {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 28px;
  border: 1px dashed var(--color-gray-300, #d4d4d4);
  border-radius: 8px;
  max-width: 720px;
}

.tv-info-placeholder p {
  font-size: 13px;
  color: var(--color-gray-500, #6b6b6b);
  line-height: 1.65;
  margin: 0;
}

.tv-replay-row { display: flex; justify-content: flex-start; }

/* Panel transitions */
.tv-slide-enter-active, .tv-slide-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.tv-slide-enter-from { opacity: 0; transform: translateY(8px); }
.tv-slide-leave-to  { opacity: 0; transform: translateY(-6px); }

/* ══════════════════════════════════════
   RECAP ÉTAPES
══════════════════════════════════════ */
.tv-recap-section {
  background: var(--color-cream, #f5f3ef);
  padding: 72px 0 80px;
  border-top: 1px solid var(--color-gray-200, #e8e8e8);
}

.tv-recap-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.tv-recap-card {
  background: var(--color-white, #fff);
  border: 1px solid var(--color-gray-200, #e8e8e8);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s ease;
}

.tv-recap-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.tv-recap-card--complete {
  border-color: rgba(201,169,97,0.45);
}

/* Card top strip */
.tv-recap-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid var(--color-gray-200, #e8e8e8);
  background: var(--color-off-white, #fafaf8);
}

.tv-recap-num {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--step-color, #c9a961);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-secondary, sans-serif);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tv-recap-title-block {
  flex: 1;
  min-width: 0;
}

.tv-recap-when {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-gray-400, #a0a0a0);
  display: block;
  margin-bottom: 3px;
}

.tv-recap-city {
  font-family: var(--font-primary, 'Cormorant Garamond', serif);
  font-size: 1.15rem;
  font-weight: 400;
  color: var(--color-primary, #1a1a1a);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tv-recap-progress { flex-shrink: 0; }

/* Description */
.tv-recap-info {
  font-size: 13px;
  color: var(--color-gray-600, #4a4a4a);
  line-height: 1.7;
  padding: 16px 20px 0;
  margin: 0;
}

/* Task list */
.tv-recap-tasks {
  list-style: none;
  padding: 14px 20px 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.tv-recap-task { display: flex; }

.tv-recap-task-label {
  display: flex;
  align-items: center;
  gap: 11px;
  cursor: pointer;
  width: 100%;
}

.tv-recap-check {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1.5px solid var(--color-gray-300, #d4d4d4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c9a961;
  transition: border-color 0.25s, background 0.25s;
}

.tv-recap-task--done .tv-recap-check {
  background: rgba(201,169,97,0.12);
  border-color: var(--color-secondary, #c9a961);
}

.tv-recap-tick {
  stroke-dasharray: 16;
  stroke-dashoffset: 16;
  transition: stroke-dashoffset 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tv-recap-task--done .tv-recap-tick { stroke-dashoffset: 0; }

.tv-recap-task-text {
  font-size: 13px;
  color: var(--color-primary, #1a1a1a);
  line-height: 1.45;
  transition: color 0.2s;
}

.tv-recap-task--done .tv-recap-task-text {
  color: var(--color-gray-400, #a0a0a0);
  text-decoration: line-through;
  text-decoration-color: rgba(201,169,97,0.5);
}

/* Tips */
.tv-recap-tips {
  margin: 16px 20px 0;
  padding: 14px 16px;
  background: var(--color-off-white, #fafaf8);
  border-radius: 8px;
  border-left: 3px solid var(--color-gray-200, #e8e8e8);
}

.tv-recap-tips-heading {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-gray-400, #a0a0a0);
  margin: 0 0 8px;
}

.tv-recap-tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tv-recap-tips-list li {
  font-size: 12px;
  color: var(--color-gray-600, #4a4a4a);
  line-height: 1.5;
  padding-left: 12px;
  position: relative;
}

.tv-recap-tips-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-secondary, #c9a961);
}

/* Actions */
.tv-recap-actions {
  padding: 16px 20px 20px;
  margin-top: auto;
}

.tv-recap-action-btn { width: 100%; text-align: center; display: block; }

/* sr-only (shared) */
.tv-sr-only {
  position: absolute;
  width: 1px; height: 1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}

/* ══════════════════════════════════════
   LINKS
══════════════════════════════════════ */
.tv-links-section {
  background: var(--color-white, #fff);
  padding: 72px 0 80px;
  border-top: 1px solid var(--color-gray-200, #e8e8e8);
}

.tv-links-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.tv-link-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 22px;
  background: var(--color-off-white, #fafaf8);
  border: 1px solid var(--color-gray-200, #e8e8e8);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.25s, background 0.25s, transform 0.25s, box-shadow 0.25s;
}

.tv-link-card:hover {
  border-color: var(--color-secondary, #c9a961);
  background: var(--color-white, #fff);
  transform: translateY(-3px);
  box-shadow: 0 6px 24px rgba(0,0,0,0.1);
}

.tv-link-badge {
  flex-shrink: 0;
  width: 46px; height: 46px;
  border-radius: 8px;
  background: rgba(201,169,97,0.1);
  border: 1px solid rgba(201,169,97,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-secondary, #c9a961);
  font-family: var(--font-secondary, sans-serif);
}

.tv-link-body { flex: 1; min-width: 0; }

.tv-link-name {
  font-family: var(--font-primary, 'Cormorant Garamond', serif);
  font-size: 1.05rem;
  font-weight: 400;
  color: var(--color-primary, #1a1a1a);
  margin: 0 0 4px;
}

.tv-link-note {
  font-size: 12px;
  color: var(--color-gray-500, #6b6b6b);
  margin: 0;
}

.tv-link-arrow {
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.25s, transform 0.25s;
}

.tv-link-card:hover .tv-link-arrow { opacity: 1; transform: translateX(0); }

/* ══════════════════════════════════════
   FOOTER
══════════════════════════════════════ */
.tv-footer {
  background: var(--color-cream, #f5f3ef);
  padding: 64px 0 48px;
  border-top: 1px solid var(--color-gray-200, #e8e8e8);
}

.tv-footer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  margin-bottom: 40px;
}

.tv-footer-heading {
  font-family: var(--font-primary, 'Cormorant Garamond', serif);
  font-size: 1.2rem;
  font-weight: 400;
  color: var(--color-primary, #1a1a1a);
  margin: 0 0 20px;
}

.tv-footer-list {
  list-style: none;
  padding: 0; margin: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.tv-footer-list li {
  font-size: 13px;
  color: var(--color-gray-600, #4a4a4a);
  padding-left: 16px;
  position: relative;
  line-height: 1.5;
}

.tv-footer-list li::before {
  content: '';
  position: absolute;
  left: 0; top: 7px;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--color-secondary, #c9a961);
}

.tv-whatsapp-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-primary, #1a1a1a);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.04em;
  border: 1px solid var(--color-gray-300, #d4d4d4);
  border-radius: 6px;
  padding: 12px 18px;
  transition: border-color 0.25s, background 0.25s;
  margin-bottom: 16px;
}

.tv-whatsapp-btn:hover {
  border-color: #25D366;
  background: rgba(37,211,102,0.05);
}

.tv-footer-note {
  font-size: 12px;
  color: var(--color-gray-500, #6b6b6b);
  line-height: 1.65;
  margin: 0;
}

/* SIM locale */
.tv-sim-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  background: rgba(201,169,97,0.07);
  border: 1px solid rgba(201,169,97,0.25);
  border-radius: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tv-sim-info {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.tv-sim-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-secondary, #c9a961);
  white-space: nowrap;
}

.tv-sim-text {
  font-size: 13px;
  color: var(--color-gray-600, #4a4a4a);
}

.tv-sim-operators {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.tv-sim-op {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-secondary, #c9a961);
  text-decoration: none;
  border: 1px solid rgba(201,169,97,0.4);
  border-radius: 4px;
  padding: 5px 12px;
  transition: background 0.2s, border-color 0.2s;
  letter-spacing: 0.05em;
}

.tv-sim-op:hover {
  background: rgba(201,169,97,0.12);
  border-color: var(--color-secondary, #c9a961);
}

.tv-footer-divider {
  height: 1px;
  background: var(--color-gray-200, #e8e8e8);
  margin-bottom: 20px;
}

.tv-footer-credits {
  font-size: 11px;
  color: var(--color-gray-400, #a0a0a0);
  letter-spacing: 0.08em;
  text-align: center;
  margin: 0;
}

/* ══════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════ */
@media (max-width: 1100px) {
  .tv-recap-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 900px) {
  .tv-recap-grid { grid-template-columns: 1fr; }
  .tv-links-grid { grid-template-columns: 1fr; }
  .tv-footer-grid { grid-template-columns: 1fr; gap: 36px; }
  .tv-step-city { font-size: 10px; }
}

@media (max-width: 640px) {
  .tv-hero { min-height: 60vh; }
  .tv-hero-inner { padding: 56px 20px 48px; gap: 24px; }
  .tv-hero-line { font-size: clamp(3.2rem, 14vw, 5.5rem); }
  .tv-hero-ctas { flex-direction: column; align-items: flex-start; }
  .tv-map-section { padding-top: 48px; }
  .tv-map-area { height: 45vh; min-height: 280px; }
  .tv-map-bottom { padding: 24px 20px 40px; }
  .tv-steps { gap: 0; }
  .tv-step-city { display: none; }
  .tv-info-placeholder { flex-direction: column; text-align: center; }
  .tv-recap-grid { grid-template-columns: 1fr; }
  .tv-recap-section,
  .tv-links-section,
  .tv-footer { padding-top: 48px; padding-bottom: 56px; }
}

@media (prefers-reduced-motion: reduce) {
  .tv-tick { transition: none; }
  .tv-recap-card,
  .tv-link-card { transition: none; }
}
</style>
