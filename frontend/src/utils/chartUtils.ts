import * as echarts from 'echarts/core';

/**
 * Configure les options de zoom pour les graphiques ECharts
 * @param options - Les options du graphique à configurer
 * @returns Les options configurées avec zoom fonctionnel
 */
export const configureZoomOptions = (options: any) => {
  // Configuration du toolbox
  if (!options.toolbox) {
    options.toolbox = {};
  }
  
  options.toolbox.left = 'center';
  options.toolbox.itemSize = 20;
  options.toolbox.top = 25;
  options.toolbox.feature = {
    dataZoom: {
      yAxisIndex: 'none',
      title: {
        zoom: 'Zoom',
        back: 'Réinitialiser zoom'
      }
    },
    restore: {
      title: 'Restaurer'
    },
    saveAsImage: {
      title: 'Enregistrer',
      type: 'png'
    }
  };
  
  // Configuration du dataZoom
  if (!options.dataZoom) {
    options.dataZoom = [];
  }
  
  // Zoom intérieur (avec la souris/molette)
  options.dataZoom.push({
    type: 'inside',
    throttle: 50,
    start: 0,
    end: 100
  });
  
  // Slider de zoom en bas du graphique
  options.dataZoom.push({
    type: 'slider',
    show: true,
    start: 0,
    end: 100,
    height: 30,
    bottom: 10
  });
  
  // Améliorer la grille pour laisser de l'espace pour les contrôles
  if (!options.grid) {
    options.grid = {};
  }
  options.grid.bottom = 60;
  
  return options;
};
