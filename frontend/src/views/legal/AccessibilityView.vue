<template>
  <div class="accessibility-view">
    <div class="container">
      <h1>Déclaration d'accessibilité</h1>
      
      <div class="legal-content">
        <div class="last-updated">
          <p>Dernière mise à jour : 8 février 2026</p>
        </div>

        <section>
          <h2>Engagement d'accessibilité</h2>
          <p>VEYRON s'engage à rendre son site web accessible conformément aux normes internationales WCAG 2.1 niveau AA et au Référentiel Général d'Amélioration de l'Accessibilité (RGAA).</p>
          <p>Cette déclaration d'accessibilité s'applique au site <strong>https://veyron-paris.fr</strong>.</p>
        </section>

        <section>
          <h2>État de conformité</h2>
          <p>Le site <strong>veyron-paris.fr</strong> est en <strong>conformité partielle</strong> avec le RGAA 4.1 et les WCAG 2.1 niveau AA.</p>
          <p>Nous travaillons activement pour améliorer l'accessibilité de notre site et atteindre une conformité totale.</p>
        </section>

        <section>
          <h2>Résultats des tests</h2>
          <p>L'audit de conformité réalisé en février 2026 révèle que :</p>
          <ul>
            <li><strong>Navigation clavier</strong> : Tous les éléments interactifs sont accessibles au clavier avec indicateurs de focus visibles</li>
            <li><strong>Structure sémantique</strong> : Utilisation correcte des balises HTML5 (header, nav, main, footer)</li>
            <li><strong>Formulaires</strong> : Labels associés, messages d'erreur accessibles avec ARIA</li>
            <li><strong>Contrastes</strong> : Ratio minimum de 4.5:1 pour le texte normal</li>
            <li><strong>Navigation SPA</strong> : Gestion du focus après changement de route</li>
            <li><strong>Skip links</strong> : Lien d'évitement pour accéder directement au contenu principal</li>
          </ul>
        </section>

        <section>
          <h2>Technologies utilisées</h2>
          <p>Le site veyron-paris.fr utilise les technologies suivantes :</p>
          <ul>
            <li>HTML5</li>
            <li>CSS3</li>
            <li>JavaScript (Vue.js 3)</li>
            <li>ARIA (Accessible Rich Internet Applications)</li>
          </ul>
        </section>

        <section>
          <h2>Agents utilisateurs et technologies d'assistance</h2>
          <p>Les tests d'accessibilité ont été réalisés avec les combinaisons suivantes :</p>
          <ul>
            <li>NVDA (Windows) avec Firefox et Chrome</li>
            <li>JAWS (Windows) avec Firefox et Chrome</li>
            <li>VoiceOver (macOS/iOS) avec Safari</li>
            <li>TalkBack (Android) avec Chrome</li>
            <li>Navigation clavier seule (sans souris)</li>
          </ul>
        </section>

        <section>
          <h2>Contenus non accessibles</h2>
          <p>Les contenus listés ci-dessous ne sont pas encore totalement accessibles pour les raisons suivantes :</p>
          
          <h3>Non-conformités</h3>
          <ul>
            <li>Certaines images décoratives peuvent manquer d'attributs alt vides</li>
            <li>Quelques modales peuvent nécessiter une amélioration du piège de focus</li>
            <li>Certains graphiques et visualisations de données peuvent manquer de descriptions textuelles alternatives</li>
          </ul>

          <h3>Contenus exemptés</h3>
          <ul>
            <li>Contenus de tiers (cartes interactives, widgets de réseaux sociaux)</li>
            <li>Archives publiées avant septembre 2019 (exemptées par la directive européenne)</li>
          </ul>
        </section>

        <section>
          <h2>Amélioration et contact</h2>
          <p>Nous nous efforçons d'améliorer continuellement l'accessibilité de notre site web.</p>
          
          <h3>Vous rencontrez un problème d'accessibilité ?</h3>
          <p>Si vous rencontrez un défaut d'accessibilité vous empêchant d'accéder à un contenu ou une fonctionnalité du site, merci de nous le signaler :</p>
          <ul>
            <li><strong>Par email :</strong> <a href="mailto:contact@veyron-paris.fr">contact@veyron-paris.fr</a></li>
            <li><strong>Par téléphone :</strong> +33 (0)1 23 45 67 89</li>
            <li><strong>Via le formulaire de contact :</strong> <router-link to="/contact">Nous contacter</router-link></li>
          </ul>
          <p>Si vous nous signalez un défaut d'accessibilité, nous nous engageons à vous répondre dans un délai de <strong>3 jours ouvrés</strong> et à vous proposer une solution alternative accessible dans un délai de <strong>1 mois</strong>.</p>
        </section>

        <section>
          <h2>Voies de recours</h2>
          <p>Si vous constatez un défaut d'accessibilité vous empêchant d'accéder à un contenu ou une fonctionnalité du site et que vous nous l'avez signalé sans obtenir de réponse satisfaisante, vous êtes en droit de :</p>
          <ul>
            <li>Écrire un message au <a href="https://formulaire.defenseurdesdroits.fr/" target="_blank" rel="noopener noreferrer">Défenseur des droits</a></li>
            <li>Contacter le <a href="https://www.defenseurdesdroits.fr/saisir/delegues" target="_blank" rel="noopener noreferrer">délégué du Défenseur des droits dans votre région</a></li>
            <li>Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) :<br>
              Défenseur des droits<br>
              Libre réponse 71120<br>
              75342 Paris CEDEX 07
            </li>
          </ul>
        </section>

        <section>
          <h2>Fonctionnalités d'accessibilité disponibles</h2>
          <p>Notre site propose les fonctionnalités d'accessibilité suivantes :</p>
          <ul>
            <li><strong>Navigation au clavier :</strong> Tous les éléments interactifs sont accessibles avec la touche Tab</li>
            <li><strong>Indicateurs de focus :</strong> Contour bleu visible sur l'élément actif</li>
            <li><strong>Skip link :</strong> Lien "Aller au contenu principal" en haut de page (visible au focus clavier)</li>
            <li><strong>Textes alternatifs :</strong> Images informatives avec descriptions</li>
            <li><strong>Formulaires accessibles :</strong> Labels associés, messages d'erreur clairs</li>
            <li><strong>Contrastes suffisants :</strong> Ratio minimum de 4.5:1 pour le texte</li>
            <li><strong>Zoom :</strong> Support du zoom jusqu'à 200% sans perte de contenu</li>
            <li><strong>Animations réduites :</strong> Respect de la préférence prefers-reduced-motion</li>
          </ul>
        </section>

        <section>
          <h2>Normes et références</h2>
          <p>Cette déclaration d'accessibilité a été établie en se basant sur les référentiels suivants :</p>
          <ul>
            <li><strong>WCAG 2.1</strong> (Web Content Accessibility Guidelines) niveau AA</li>
            <li><strong>RGAA 4.1</strong> (Référentiel Général d'Amélioration de l'Accessibilité)</li>
            <li><strong>Directive européenne 2016/2102</strong> relative à l'accessibilité des sites internet et des applications mobiles</li>
            <li><strong>European Accessibility Act (EAA)</strong> - Application prévue en 2025</li>
          </ul>
        </section>

        <section>
          <h2>Retour d'information et coordonnées</h2>
          <p>Nous accueillons vos retours sur l'accessibilité de notre site web. N'hésitez pas à nous contacter si :</p>
          <ul>
            <li>Vous rencontrez des obstacles à l'accessibilité sur veyron-paris.fr</li>
            <li>Vous avez des suggestions d'amélioration</li>
            <li>Vous souhaitez obtenir des informations dans un format accessible</li>
          </ul>
          <p><strong>Contact accessibilité :</strong></p>
          <ul>
            <li>Email : <a href="mailto:contact@veyron-paris.fr">contact@veyron-paris.fr</a></li>
            <li>Téléphone : +33 (0)1 23 45 67 89</li>
            <li>Formulaire : <router-link to="/contact">Page de contact</router-link></li>
          </ul>
        </section>

        <section>
          <h2>Schéma pluriannuel et plan d'action</h2>
          <p>VEYRON s'engage dans une démarche d'amélioration continue de l'accessibilité de ses services numériques.</p>
          
          <h3>Actions en cours (2026)</h3>
          <ul>
            <li>Audit complet RGAA 4.1 de toutes les pages</li>
            <li>Formation des équipes de développement aux bonnes pratiques d'accessibilité</li>
            <li>Mise en place de tests automatisés d'accessibilité dans le processus de développement</li>
            <li>Amélioration de l'accessibilité des contenus multimédias</li>
          </ul>

          <h3>Objectifs 2026-2027</h3>
          <ul>
            <li>Atteindre 100% de conformité WCAG 2.1 niveau AA</li>
            <li>Obtenir la certification RGAA 4.1</li>
            <li>Mettre en place un processus de veille et de maintenance de l'accessibilité</li>
            <li>Créer une documentation d'accessibilité pour les contributeurs de contenu</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.accessibility-view {
  padding: 2rem 0;
  width: 100%;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  font-family: var(--font-heading);
  margin-bottom: 2rem;
  text-align: center;
}

.legal-content {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.last-updated {
  margin-bottom: 2rem;
  text-align: right;
  font-style: italic;
  color: #666;
}

section {
  margin-bottom: 2rem;
}

h2 {
  font-family: var(--font-heading);
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

h3 {
  font-family: var(--font-heading);
  margin: 1.5rem 0 0.5rem;
}

p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

ul, ol {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

a {
  color: var(--color-link);
  text-decoration: underline;
}

a:hover {
  color: var(--color-link-hover);
}

strong {
  font-weight: 600;
}
</style>
