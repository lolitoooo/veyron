<template>
  <div class="about-view">
    <div class="container">
      <h1>À propos de VEYRON</h1>
      
      <div class="about-content">
        <div class="about-image">
          <img src="https://via.placeholder.com/600x400" alt="VEYRON Luxury Fashion" />
        </div>
        
        <div class="about-text">
          <h2>Notre Histoire</h2>
          <p>Fondée en 2020, VEYRON est une marque de mode de luxe qui incarne l'élégance intemporelle et le savoir-faire français. Notre mission est de créer des pièces exceptionnelles qui allient design contemporain et techniques traditionnelles.</p>
          
          <h2>Notre Vision</h2>
          <p>Chez VEYRON, nous croyons que le luxe véritable réside dans la qualité, la durabilité et l'éthique. Chaque pièce est conçue pour durer et traverser les tendances, avec une attention particulière portée aux détails et aux finitions.</p>
          
          <h2>Nos Valeurs</h2>
          <ul>
            <li><strong>Excellence</strong> - Nous nous engageons à offrir des produits d'une qualité irréprochable.</li>
            <li><strong>Durabilité</strong> - Nous sélectionnons des matériaux responsables et adoptons des pratiques respectueuses de l'environnement.</li>
            <li><strong>Innovation</strong> - Nous repoussons constamment les limites du design et de la technologie.</li>
            <li><strong>Authenticité</strong> - Nous restons fidèles à notre héritage tout en évoluant avec notre temps.</li>
          </ul>
        </div>
      </div>
      
      <div class="team-section">
        <h2>Notre Équipe</h2>
        <p>VEYRON est portée par une équipe de passionnés, d'artisans et de créatifs qui partagent une vision commune de l'excellence et de l'innovation.</p>
        
        <div class="team-grid">
          <div class="team-member">
            <div class="member-image">
              <img src="https://via.placeholder.com/300x300" alt="Fondateur" />
            </div>
            <h3>Jean Dupont</h3>
            <p>Fondateur & Directeur Créatif</p>
          </div>
          
          <div class="team-member">
            <div class="member-image">
              <img src="https://via.placeholder.com/300x300" alt="Directrice Design" />
            </div>
            <h3>Marie Laurent</h3>
            <p>Directrice du Design</p>
          </div>
          
          <div class="team-member">
            <div class="member-image">
              <img src="https://via.placeholder.com/300x300" alt="Directeur Production" />
            </div>
            <h3>Pierre Martin</h3>
            <p>Directeur de Production</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-view {
  padding: 2rem 0;
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  font-family: var(--font-heading);
  margin-bottom: 2rem;
  text-align: center;
}

h2 {
  font-family: var(--font-heading);
  margin: 1.5rem 0 1rem;
}

p {
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.about-content {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 3rem;
}

.about-image {
  flex: 1;
  min-width: 300px;
}

.about-image img {
  width: 100%;
  height: auto;
  border-radius: 4px;
}

.about-text {
  flex: 1;
  min-width: 300px;
}

ul {
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
}

.team-section {
  margin-top: 3rem;
  text-align: center;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.team-member {
  text-align: center;
}

.member-image {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 1rem;
}

.member-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.team-member h3 {
  margin-bottom: 0.5rem;
  font-family: var(--font-heading);
}

.team-member p {
  color: var(--color-text-light);
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .about-content {
    flex-direction: column;
  }
  
  .member-image {
    width: 150px;
    height: 150px;
  }
}
</style>
