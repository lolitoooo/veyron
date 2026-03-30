<script setup lang="ts">
import { ref } from 'vue';

const menuOpen = ref(false);
const toggleMenu = () => { menuOpen.value = !menuOpen.value; };
const closeMenu = () => { menuOpen.value = false; };
</script>

<template>
  <div class="home" role="presentation" @click="closeMenu" @keydown.escape="closeMenu">

    <!-- ── Grille (divs CSS) ── -->
    <div class="grid-line grid-v1"></div>
    <div class="grid-line grid-h1"></div>
    <div class="grid-line grid-v2"></div>
    <div class="grid-line grid-d1"></div>

    <!-- ── Burger ── -->
    <button class="menu-btn" @click.stop="toggleMenu" aria-label="Menu">
      <span></span>
      <span></span>
    </button>

    <!-- ── Menu slide-in ── -->
    <div class="slide-menu" :class="{ open: menuOpen }" role="dialog" aria-modal="true" aria-label="Navigation">
      <button class="slide-close" @click="closeMenu" aria-label="Fermer">✕</button>
      <nav class="slide-nav">
        <router-link to="/category/femme"      @click="closeMenu">Femme</router-link>
        <router-link to="/category/homme"      @click="closeMenu">Homme</router-link>
        <router-link to="/category/accessoires" @click="closeMenu">Accessoires</router-link>
        <router-link to="/category/collections" @click="closeMenu">Collections</router-link>
        <router-link to="/contact"             @click="closeMenu">Contact</router-link>
        <router-link to="/account"             @click="closeMenu">Mon compte</router-link>
        <router-link to="/cart"                @click="closeMenu">Panier</router-link>
      </nav>
    </div>
    <button v-if="menuOpen" class="slide-backdrop" aria-label="Fermer le menu" @click="closeMenu"></button>

    <!-- ── Photo du mannequin (sous le titre) ── -->
    <div class="hero-wrap">
      <img
        src="@/assets/images/bg-home.png"
        alt="VEYRON – L'élégance parisienne"
        class="hero-img"
      />
    </div>

    <!-- ── Titre VEYRON – à droite, par-dessus l'image ── -->
    <h1 class="brand-title" aria-label="VEYRON">VEYRON</h1>

    <!-- ── Texte éditorial gauche ── -->
    <div class="left-copy">
      <h2 class="headline">L'ÉLÉGENCE<br>PARISINNE</h2>
      <p class="sub">AVANT-GARDE V2.</p>
      <p class="sub">LE FUTURE DE LA MODE.</p>
    </div>

    <!-- ── Trait de séparation bas ── -->
    <div class="bottom-line" aria-hidden="true"></div>

    <!-- ── Navigation basse ── -->
    <router-link to="/category" class="blink nav-explore">EXPLORE</router-link>
    <div class="nav-center">
      <router-link to="/contact" class="blink">CONTACT</router-link>
      <router-link to="/account" class="blink">ACCOUNT</router-link>
    </div>
    <span class="blink nav-paris">PARIS</span>

  </div>
</template>

<!-- Police lourde pour le titre éditorial -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&display=swap');
</style>

<style scoped>
/* ─────────────────────────────────────────
   Base
───────────────────────────────────────── */
.home {
  position: relative;
  width: 100%;
  height: 100svh;
  min-height: 100vh;
  background: var(--color-bg);
  overflow: hidden;
  font-family: var(--font-body);
}

/* ─────────────────────────────────────────
   Grille
───────────────────────────────────────── */
.grid-line {
  position: absolute;
  z-index: 1;
  pointer-events: none;
  background: #111;
}

/* Verticale 1 — 200px du bord gauche, pleine hauteur */
.grid-v1 {
  left: 200px;
  top: 0;
  width: 2px;
  height: 100%;
}

/* Horizontale — pleine largeur à 50% de la hauteur */
.grid-h1 {
  left: 0;
  top: 50%;
  width: 100%;
  height: 2px;
}

/* Verticale 2 — à 58.5% du bord gauche, du haut jusqu'à 50% */
.grid-v2 {
  left: 60.25%;
  top: 0;
  width: 2px;
  height: 50%;
}

/* Diagonale — bas-gauche → croisement (200px, 50%) → haut vers titre */
.grid-d1 {
  left: 200px;
  top: 50.5%;
  width: 2px;
  height: 120vh;
  transform: translate(-50%, -50%) rotate(21deg);
}

/* ─────────────────────────────────────────
   Hamburger
───────────────────────────────────────── */
.menu-btn {
  position: absolute;
  top: 3.5%;
  left: 3.5%;
  z-index: 20;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 6px;
}

.menu-btn span {
  display: block;
  width: 70px;
  height: 2px;
  background: #111;
  transition: opacity 0.2s;
}

.menu-btn:hover span { opacity: 0.45; }

/* ─────────────────────────────────────────
   Menu slide
───────────────────────────────────────── */
.slide-backdrop {
  position: fixed;
  inset: 0;
  z-index: 29;
  background: transparent;
  border: none;
  padding: 0;
  cursor: default;
}

.slide-menu {
  position: fixed;
  inset: 0 auto 0 0;
  width: 290px;
  background: #111;
  z-index: 30;
  transform: translateX(-100%);
  transition: transform 0.42s cubic-bezier(0.76, 0, 0.24, 1);
  display: flex;
  flex-direction: column;
  padding: 2.5rem 2rem;
}

.slide-menu.open { transform: translateX(0); }

.slide-close {
  background: none;
  border: none;
  color: #ece6d4;
  font-size: 1.15rem;
  cursor: pointer;
  align-self: flex-end;
  margin-bottom: 2.5rem;
  opacity: 0.65;
  transition: opacity 0.2s;
}

.slide-close:hover { opacity: 1; }

.slide-nav {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.slide-nav a {
  color: #ece6d4;
  text-decoration: none;
  font-family: var(--font-heading);
  font-weight: 300;
  font-size: 1.65rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: opacity 0.2s;
  border-bottom: 1px solid rgba(236,230,212,0.1);
  padding: 1.1rem 0;
}

.slide-nav a:last-child { border-bottom: none; }
.slide-nav a:hover { opacity: 0.55; }

/* ─────────────────────────────────────────
   Image du mannequin
   Positionnée au croisement ligne 3 (x=44%)
   – ligne 4 (y) à venir
───────────────────────────────────────── */
.hero-wrap {
  position: absolute;
  left: 44%;         /* alignée sur la ligne 3 */
  top: 15%;           /* légèrement baissée */
  width: 30%;
  height: 80%;
  z-index: 3;
  overflow: hidden;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: top center;
  display: block;
}

/* ─────────────────────────────────────────
   Titre VEYRON
   – collé à droite, passe par-dessus l'image
───────────────────────────────────────── */
.brand-title {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  text-align: right;
  padding-right: 0.3%;
  /* font-family: 'Playfair Display', var(--font-heading), serif; */
  font-weight: 900;
  font-size: clamp(4.5rem, 19.5vw, 17.4rem);
  line-height: 0.88;
  letter-spacing: -0.01em;
  color: #0d0d0d;
  z-index: 5;           /* par-dessus l'image */
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

/* ─────────────────────────────────────────
   Texte éditorial gauche
   – entre ligne 1 et ligne 3, sous la mi-hauteur
───────────────────────────────────────── */
.left-copy {
  position: absolute;
  left: 16.5%;
  bottom: 20%;
  width: 35%;
  z-index: 4;
}

.headline {
  font-family: var(--font-heading);
  font-weight: 400;
  font-style: italic;
  font-size: clamp(1.6rem, 3.2vw, 4.2rem);
  line-height: 1.08;
  color: #111;
  margin-bottom: 0.85rem;
  letter-spacing: -0.01em;
  font-size: 5rem;
}

.sub {
  font-family: var(--font-body);
  font-size: clamp(0.52rem, 0.72vw, 0.76rem);
  letter-spacing: 0.2em;
  color: #111;
  margin: 0;
  line-height: 1.85;
}

/* ─────────────────────────────────────────
   Navigation basse
───────────────────────────────────────── */
.bottom-line {
  position: absolute;
  bottom: 8%;
  left: 0;
  right: 0;
  height: 0.7px;
  background: rgba(17,17,17,0.22);
  z-index: 6;
}

.blink {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: clamp(0.75rem, 1vw, 1.05rem);
  letter-spacing: 0.2em;
  color: #111;
  text-decoration: underline;
  text-underline-offset: 5px;
  text-decoration-thickness: 0.7px;
  transition: opacity 0.2s;
}

.blink:hover {
  opacity: 0.45;
}

.nav-explore {
  position: absolute;
  left: 16.5%;
  bottom: 3%;
  z-index: 6;
}

.nav-center {
  position: absolute;
  left: 44%;
  bottom: 3%;
  display: flex;
  align-items: center;
  gap: 1.8rem;
  z-index: 6;
}

.nav-paris {
  position: absolute;
  right: 5%;
  bottom: 3%;
  opacity: 0.45;
  z-index: 6;
  text-decoration: none;
  font-size: clamp(0.75rem, 1vw, 1.05rem);
}

/* ─────────────────────────────────────────
   RESPONSIVE – Tablette
───────────────────────────────────────── */
@media (max-width: 960px) {
  .hero-wrap {
    left: 44%;
    width: 33%;
    height: 76%;
  }

  .left-copy {
    bottom: 14%;
    width: 37%;
  }
}

/* ─────────────────────────────────────────
   RESPONSIVE – Mobile
───────────────────────────────────────── */
@media (max-width: 640px) {
  .grid-line { display: none; }

  .menu-btn {
    top: 3%;
    left: 4%;
  }

  /* Titre fantôme derrière l'image sur mobile */
  .brand-title {
    top: auto;
    bottom: 38%;
    font-size: clamp(3.5rem, 20vw, 6rem);
    color: rgba(13,13,13,0.07);
    z-index: 2;
    line-height: 1;
  }

  .hero-wrap {
    left: 0;
    top: 0;
    width: 100%;
    height: 58%;
    z-index: 3;
  }

  .left-copy {
    left: 5%;
    bottom: 12%;
    width: 90%;
    z-index: 4;
  }

  .headline {
    font-size: clamp(2rem, 8.5vw, 3.2rem);
  }

  .sub {
    font-size: 0.62rem;
    letter-spacing: 0.15em;
  }

  .bottom-bar {
    height: 10%;
    min-height: 46px;
    padding: 0 4%;
  }

  .bottom-left,
  .bottom-right {
    gap: 0.9rem;
  }

  .blink {
    font-size: 0.58rem;
    letter-spacing: 0.12em;
  }
}

@media (max-width: 380px) {
  /* "VIEW LOOKBOOK" trop large sur très petit écran */
  .bottom-left .blink:last-child { display: none; }
}
</style>
