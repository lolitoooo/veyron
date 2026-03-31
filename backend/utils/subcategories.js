const SUBCATEGORIES_BY_CATEGORY = {
  'femme': [
    'Robes',
    'Jupes',
    'Pantalons Femme',
    'Jeans Femme',
    'Shorts Femme',
    'Chemisiers',
    'Tops',
    'T-shirts Femme',
    'Pulls Femme',
    'Gilets Femme',
    'Vestes Femme',
    'Manteaux Femme',
    'Blazers Femme'
  ],
  'homme': [
    'Chemises',
    'Polos',
    'T-shirts Homme',
    'Pulls Homme',
    'Sweats',
    'Pantalons Homme',
    'Jeans Homme',
    'Shorts Homme',
    'Vestes Homme',
    'Manteaux Homme',
    'Costumes',
    'Blazers Homme'
  ],
  'accessoires': [
    'Sacs à Main',
    'Sacs à Dos',
    'Portefeuilles',
    'Ceintures',
    'Écharpes',
    'Bonnets',
    'Casquettes',
    'Chapeaux',
    'Gants',
    'Lunettes de Soleil',
    'Montres',
    'Bijoux',
    'Chaussures Femme',
    'Chaussures Homme',
    'Baskets',
    'Bottes'
  ]
};

const ALL_SUBCATEGORIES = [
  'Robes', 'Jupes', 'Pantalons Femme', 'Jeans Femme', 'Shorts Femme', 'Chemisiers', 'Tops', 'T-shirts Femme', 'Pulls Femme', 'Gilets Femme', 'Vestes Femme', 'Manteaux Femme', 'Blazers Femme',
  'Chemises', 'Polos', 'T-shirts Homme', 'Pulls Homme', 'Sweats', 'Pantalons Homme', 'Jeans Homme', 'Shorts Homme', 'Vestes Homme', 'Manteaux Homme', 'Costumes', 'Blazers Homme',
  'Sacs à Main', 'Sacs à Dos', 'Portefeuilles', 'Ceintures', 'Écharpes', 'Bonnets', 'Casquettes', 'Chapeaux', 'Gants', 'Lunettes de Soleil', 'Montres', 'Bijoux', 'Chaussures Femme', 'Chaussures Homme', 'Baskets', 'Bottes'
];

const getSubcategoriesByCategory = (categorySlug) => {
  const slug = categorySlug.toLowerCase();
  return SUBCATEGORIES_BY_CATEGORY[slug] || [];
};

const isValidSubcategory = (subcategory) => {
  return ALL_SUBCATEGORIES.includes(subcategory);
};

const subcategoryBelongsToCategory = (subcategory, categorySlug) => {
  const slug = categorySlug.toLowerCase();
  const subcategories = SUBCATEGORIES_BY_CATEGORY[slug] || [];
  return subcategories.includes(subcategory);
};

module.exports = {
  SUBCATEGORIES_BY_CATEGORY,
  ALL_SUBCATEGORIES,
  getSubcategoriesByCategory,
  isValidSubcategory,
  subcategoryBelongsToCategory
};
