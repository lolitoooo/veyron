<template>
  <div class="categories-page">
    <div class="categories-header">
      <h1>Nos Collections</h1>
      <p>Découvrez nos collections exclusives pour chaque style et occasion</p>
    </div>
    
    <div class="categories-grid">
      <router-link to="/category/homme" class="category-card">
        <div class="category-image">
          <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" alt="Collection Homme" />
          <div class="category-overlay">
            <h2>Homme</h2>
            <p>Élégance et modernité pour chaque occasion</p>
            <span class="explore-button">Explorer</span>
          </div>
        </div>
      </router-link>
      
      <router-link to="/category/femme" class="category-card">
        <div class="category-image">
          <img src="https://images.unsplash.com/photo-1581044777550-4cfa60707c03?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" alt="Collection Femme" />
          <div class="category-overlay">
            <h2>Femme</h2>
            <p>Raffinement et style pour toutes les saisons</p>
            <span class="explore-button">Explorer</span>
          </div>
        </div>
      </router-link>
      
      <router-link to="/category/accessoires" class="category-card">
        <div class="category-image">
          <img src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" alt="Accessoires" />
          <div class="category-overlay">
            <h2>Accessoires</h2>
            <p>Le détail qui fait toute la différence</p>
            <span class="explore-button">Explorer</span>
          </div>
        </div>
      </router-link>
      
      <router-link to="/category/collections" class="category-card">
        <div class="category-image">
          <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" alt="Collections Exclusives" />
          <div class="category-overlay">
            <h2>Collections</h2>
            <p>Nos éditions limitées et pièces exclusives</p>
            <span class="explore-button">Explorer</span>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.categories-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

.categories-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
}

.categories-header h1 {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 400;
  margin-bottom: 1rem;
  letter-spacing: 0.1rem;
}

.categories-header p {
  font-size: 1.1rem;
  color: var(--color-text-light);
  max-width: 600px;
  margin: 0 auto;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.category-card {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  display: block;
  color: inherit;
}

.category-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

.category-image {
  position: relative;
  height: 500px;
  overflow: hidden;
}

.category-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s ease;
}

.category-card:hover .category-image img {
  transform: scale(1.05);
}

.category-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  color: white;
  transform: translateY(0);
  transition: transform 0.5s ease;
}

.category-overlay h2 {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 400;
  margin-bottom: 0.5rem;
  letter-spacing: 0.1rem;
}

.category-overlay p {
  font-size: 1rem;
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

.explore-button {
  display: inline-block;
  padding: 0.6rem 1.5rem;
  background-color: white;
  color: black;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 2px;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
}

.category-card:hover .explore-button {
  opacity: 1;
  transform: translateY(0);
}

.category-card:hover .category-overlay {
  transform: translateY(0);
}

@media (max-width: 992px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .category-image {
    height: 400px;
  }
}

@media (max-width: 768px) {
  .categories-header h1 {
    font-size: 2rem;
  }
  
  .categories-header p {
    font-size: 1rem;
  }
  
  .category-overlay h2 {
    font-size: 1.5rem;
  }
  
  .category-overlay p {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .category-image {
    height: 300px;
  }
  
  .category-overlay {
    padding: 1.5rem;
  }
}
</style>
