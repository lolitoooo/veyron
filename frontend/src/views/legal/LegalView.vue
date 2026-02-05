<template>
  <div class="legal-view">
    <div class="container">
      <h1>Mentions Légales</h1>
      
      <div class="legal-content">
        <div class="last-updated">
          <p>Dernière mise à jour : 20 juin 2025</p>
        </div>
        
        <section>
          <h2>1. Informations légales</h2>
          <p>Le site www.veyron.com est édité par :</p>
          <div class="company-info">
            <p><strong>VEYRON SAS</strong></p>
            <p>Société par actions simplifiée au capital de 50 000 euros</p>
            <p>Siège social : 123 Avenue de la Mode, 75008 Paris, France</p>
            <p>RCS Paris B 123 456 789</p>
            <p>N° TVA intracommunautaire : FR 12 345 678 901</p>
            <p>Téléphone : +33 (0)1 23 45 67 89</p>
            <p>Email : contact@veyron-paris.com</p>
          </div>
          
          <p>Directeur de la publication : Jean Dupont, Président</p>
        </section>
        
        <section>
          <h2>2. Hébergement</h2>
          <p>Le site www.veyron.com est hébergé par :</p>
          <div class="hosting-info">
            <p><strong>CloudHost SAS</strong></p>
            <p>Société par actions simplifiée au capital de 200 000 euros</p>
            <p>Siège social : 45 Rue du Serveur, 69000 Lyon, France</p>
            <p>RCS Lyon B 987 654 321</p>
            <p>Téléphone : +33 (0)4 56 78 90 12</p>
          </div>
        </section>
        
        <section>
          <h2>3. Propriété intellectuelle</h2>
          <p>L'ensemble du contenu du site www.veyron.com (structure, textes, logos, images, vidéos, sons, etc.) est la propriété exclusive de VEYRON SAS ou de ses partenaires. Toute reproduction, représentation, modification, publication, adaptation ou exploitation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de VEYRON SAS.</p>
          <p>Les marques et logos figurant sur le site sont des marques déposées par VEYRON SAS ou ses partenaires. Toute reproduction, imitation ou utilisation, totale ou partielle, de ces signes distinctifs sans autorisation expresse et préalable de VEYRON SAS est prohibée et constitue une contrefaçon sanctionnée par le Code de la propriété intellectuelle.</p>
        </section>
        
        <section>
          <h2>4. Liens hypertextes</h2>
          <p><strong>4.1 Liens vers le site www.veyron.com</strong></p>
          <p>La création de liens hypertextes vers le site www.veyron.com est soumise à l'accord préalable de VEYRON SAS. Pour toute demande, veuillez contacter : contact@veyron-paris.com.</p>
          
          <p><strong>4.2 Liens depuis le site www.veyron.com</strong></p>
          <p>Le site www.veyron.com peut contenir des liens hypertextes vers d'autres sites Internet. VEYRON SAS ne saurait être tenue pour responsable du contenu de ces sites et des éventuels dommages ou préjudices pouvant résulter de leur consultation.</p>
        </section>
        
        <section>
          <h2>5. Protection des données personnelles</h2>
          <p>Les informations concernant la collecte et le traitement des données personnelles sont détaillées dans notre <router-link to="/privacy">Politique de Confidentialité</router-link>.</p>
        </section>
        
        <section>
          <h2>6. Cookies</h2>
          <p>Le site www.veyron.com utilise des cookies pour améliorer l'expérience utilisateur. Pour plus d'informations sur l'utilisation des cookies, veuillez consulter notre <router-link to="/privacy">Politique de Confidentialité</router-link>.</p>
        </section>
        
        <section>
          <h2>7. Droit applicable et juridiction compétente</h2>
          <p>Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
        </section>
        
        <section>
          <h2>8. Crédits</h2>
          <p><strong>Conception et développement :</strong> VEYRON Digital Team</p>
          <p><strong>Photographies :</strong> VEYRON Studio, sauf mention contraire</p>
          <p><strong>Illustrations :</strong> VEYRON Design</p>
        </section>
        
        <section>
          <h2>9. Contact</h2>
          <p>Pour toute question concernant le site www.veyron.com, vous pouvez nous contacter :</p>
          <ul>
            <li>Par email : contact@veyron-paris.com</li>
            <li>Par téléphone : +33 (0)1 23 45 67 89 (du lundi au vendredi, de 9h à 18h)</li>
            <li>Par courrier : VEYRON SAS, Service Client, 123 Avenue de la Mode, 75008 Paris, France</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legal-view {
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

p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.company-info, .hosting-info {
  margin: 1rem 0;
  padding-left: 1rem;
  border-left: 3px solid #eee;
}

ul {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

a {
  color: #000;
  text-decoration: underline;
}

a:hover {
  color: #333;
}
</style>
