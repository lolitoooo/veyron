const axios = require('axios');
const crypto = require('crypto');


class RelayPointService {
  constructor() {
    // Overpass API - 100% gratuit, sans identifiants
    this.overpassApi = {
      apiUrl: 'https://overpass-api.de/api/interpreter'
    };
  }

  async searchRelayPoints(postalCode, country = 'FR', limit = 10) {
    try {
      console.log('=== Début recherche points relais (OpenStreetMap) ===');
      console.log('Paramètres:', { postalCode, country, limit });

      // Recherche via Overpass API (OpenStreetMap) - 100% gratuit
      const results = await this.searchOverpassAPI(postalCode, country, limit);
      
      console.log(`Total: ${results.length} points relais retournés`);
      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche de points relais:', error.message);
      // Retourner un tableau vide en cas d'erreur
      return [];
    }
  }

  async searchOverpassAPI(postalCode, country, limit) {
    try {
      // Obtenir les coordonnées du code postal recherché
      const searchCoords = this.getCoordinatesFromPostalCode(postalCode);
      const [searchLat, searchLon] = searchCoords.split(',').map(parseFloat);
      
      // Requête Overpass QL ultra-simplifiée - recherche uniquement les bureaux de poste
      const overpassQuery = `
[out:json][timeout:15];
(
  node["amenity"="post_office"](around:10000,${searchCoords});
);
out center ${limit};
      `.trim();

      console.log('Requête Overpass API pour code postal:', postalCode);

      const response = await axios.post(
        this.overpassApi.apiUrl,
        overpassQuery,
        {
          headers: {
            'Content-Type': 'text/plain'
          },
          timeout: 15000 // Augmenté à 15 secondes
        }
      );

      console.log(`Overpass API: ${response.data.elements?.length || 0} éléments trouvés`);

      if (!response.data.elements || response.data.elements.length === 0) {
        console.warn('⚠️ Aucun point relais trouvé via OpenStreetMap');
        return [];
      }

      // Log des premiers éléments pour debug
      if (response.data.elements.length > 0) {
        console.log('Premier élément OSM:', JSON.stringify(response.data.elements[0], null, 2));
      }

      // Transformer les résultats OSM en format standardisé
      const points = response.data.elements
        .filter(element => element.tags && (element.lat || element.center))
        .map((element, index) => {
          const tags = element.tags;
          const lat = element.lat || element.center?.lat;
          const lon = element.lon || element.center?.lon;
          
          // Déterminer le type de point relais
          let carrier = 'Point Relais';
          if (tags.brand === 'Mondial Relay') carrier = 'Mondial Relay';
          else if (tags.brand === 'Relais Colis') carrier = 'Relais Colis';
          else if (tags.amenity === 'post_office') carrier = 'La Poste';
          else if (tags.amenity === 'parcel_locker') carrier = 'Consigne Colis';
          
          const name = tags.name || tags.brand || carrier;
          
          // Construire l'adresse avec plusieurs fallbacks
          let address = '';
          if (tags['addr:housenumber'] && tags['addr:street']) {
            address = `${tags['addr:housenumber']} ${tags['addr:street']}`;
          } else if (tags['addr:street']) {
            address = tags['addr:street'];
          } else if (tags['addr:place']) {
            address = tags['addr:place'];
          } else if (tags['addr:hamlet']) {
            address = tags['addr:hamlet'];
          } else {
            // Utiliser le nom comme adresse si rien d'autre n'est disponible
            address = name;
          }
          
          // Ville avec plusieurs fallbacks
          const city = tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || tags['addr:municipality'] || 'Ville';
          
          // Calculer la distance réelle entre le code postal recherché et le point relais
          const distance = this.calculateDistance(searchLat, searchLon, parseFloat(lat), parseFloat(lon));
          
          return {
            id: `OSM_${element.type}_${element.id}`,
            carrier,
            name,
            address,
            postalCode: tags['addr:postcode'] || postalCode,
            city,
            country: tags['addr:country'] || country,
            distance: distance,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            openingHours: this.parseOSMOpeningHours(tags.opening_hours)
          };
        })
        .sort((a, b) => a.distance - b.distance) // Trier par distance croissante
        .slice(0, limit);

      return points;
    } catch (error) {
      console.error('Erreur Overpass API:', error.message);
      if (error.response) {
        console.error('Réponse:', error.response.data);
      }
      return [];
    }
  }

  getCoordinatesFromPostalCode(postalCode) {
    // Coordonnées précises pour certains codes postaux courants
    const exactCoordinates = {
      '77330': '48.7644,2.6739',  // Ozoir-la-Ferrière
      '77600': '48.5333,2.7167',  // Bussy-Saint-Georges
      '75001': '48.8606,2.3376',  // Paris 1er
      '75008': '48.8725,2.3101',  // Paris 8e
      '69001': '45.7679,4.8345',  // Lyon 1er
      '13001': '43.2965,5.3698',  // Marseille 1er
    };
    
    // Si on a les coordonnées exactes, les utiliser
    if (exactCoordinates[postalCode]) {
      return exactCoordinates[postalCode];
    }
    
    // Sinon, utiliser les coordonnées approximatives du département
    const dept = postalCode.substring(0, 2);
    const deptCoordinates = {
      '75': '48.8566,2.3522',  // Paris
      '77': '48.8467,2.7333',  // Seine-et-Marne (Melun)
      '78': '48.8014,2.1301',  // Yvelines
      '91': '48.6289,2.4417',  // Essonne
      '92': '48.8925,2.2078',  // Hauts-de-Seine
      '93': '48.9097,2.4444',  // Seine-Saint-Denis
      '94': '48.7833,2.4667',  // Val-de-Marne
      '95': '49.0333,2.0833',  // Val-d'Oise
      '69': '45.7640,4.8357',  // Lyon
      '13': '43.2965,5.3698',  // Marseille
      '33': '44.8378,-0.5792', // Bordeaux
      '31': '43.6047,1.4442',  // Toulouse
      '59': '50.6292,3.0573',  // Lille
      '44': '47.2184,-1.5536', // Nantes
      '67': '48.5734,7.7521',  // Strasbourg
      '35': '48.1173,-1.6778'  // Rennes
    };
    
    return deptCoordinates[dept] || '46.2276,2.2137'; // Centre de la France par défaut
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Formule de Haversine pour calculer la distance entre deux points GPS
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Arrondir à 1 décimale
    return Math.round(distance * 10) / 10;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  parseOSMOpeningHours(openingHours) {
    // Format OSM: "Mo-Fr 09:00-18:00; Sa 09:00-12:00"
    // Simplifié pour l'instant
    return {
      monday: openingHours || '',
      tuesday: openingHours || '',
      wednesday: openingHours || '',
      thursday: openingHours || '',
      friday: openingHours || '',
      saturday: openingHours || '',
      sunday: ''
    };
  }
}

module.exports = new RelayPointService();
