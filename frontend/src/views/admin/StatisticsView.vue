<template>
  <div class="statistics-view">
    <h1>Statistiques avancées</h1>
    
    <div class="tabs-container">
      <div class="tabs">
        <div 
          v-for="(tab, index) in tabs" 
          :key="index" 
          :class="['tab', { active: activeTab === index }]"
          @click="activeTab = index"
        >
          {{ tab.name }}
        </div>
      </div>
      
      <div class="tab-content">
        <div v-if="activeTab === 0" class="tab-pane">
          <h2>Statistiques des utilisateurs</h2>
          <div class="loading" v-if="loading.users">Chargement des données...</div>
          <div v-else class="charts-container">
            <div class="chart-card">
              <h3>Inscriptions par jour</h3>
              <v-chart :option="userSignupsOptions" autoresize class="chart" />
            </div>
            <div class="chart-card">
              <h3>Évolution des inscriptions</h3>
              <v-chart :option="userGrowthOptions" autoresize class="chart" />
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 1" class="tab-pane">
          <h2>Statistiques des commandes</h2>
          <div class="loading" v-if="loading.orders">Chargement des données...</div>
          <div v-else class="charts-container">
            <div class="chart-card">
              <h3>Commandes par jour</h3>
              <v-chart :option="orderDailyOptions" autoresize class="chart" />
            </div>
            <div class="chart-card">
              <h3>Évolution des commandes</h3>
              <v-chart :option="orderGrowthOptions" autoresize class="chart" />
            </div>
            <div class="chart-card">
              <h3>Répartition par statut</h3>
              <v-chart :option="orderStatusOptions" autoresize class="chart" />
            </div>
            <div class="chart-card">
              <h3>Valeur moyenne des commandes</h3>
              <v-chart :option="orderValueOptions" autoresize class="chart" />
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 2" class="tab-pane">
          <h2>Statistiques des produits</h2>
          <div class="loading" v-if="loading.products">Chargement des données...</div>
          <div v-else class="charts-container">
            <div class="chart-card">
              <h3>Produits les plus vendus</h3>
              <v-chart :option="productTopOptions" autoresize class="chart" />
            </div>
            <div class="chart-card">
              <h3>Répartition par catégorie</h3>
              <v-chart :option="productCategoryOptions" autoresize class="chart" />
            </div>
            <div class="chart-card">
              <h3>Ventes par catégorie</h3>
              <v-chart :option="categorySalesOptions" autoresize class="chart" />
            </div>
            <div class="chart-card">
              <h3>Niveau de stock</h3>
              <v-chart :option="productStockOptions" autoresize class="chart" />
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 3" class="tab-pane">
          <h2>Statistiques du chiffre d'affaires</h2>
          <div class="loading" v-if="loading.revenue">Chargement des données...</div>
          <div v-else class="charts-container">
            <div class="chart-card">
              <h3>Chiffre d'affaires par jour</h3>
              <v-chart :option="revenueDailyOptions" autoresize class="chart" />
            </div>
            <div class="chart-card">
              <h3>Évolution du chiffre d'affaires</h3>
              <v-chart :option="revenueGrowthOptions" autoresize class="chart" />
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 4" class="tab-pane">
          <h2>Géolocalisation des commandes</h2>
          <div id="map-container" class="map-container" style="display: block !important; min-height: 800px; border: 1px solid #ddd;"></div>
          <div class="loading" v-if="loading.geo" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: rgba(255,255,255,0.8); padding: 20px; border-radius: 5px;">Chargement de la carte...</div>
          <div v-if="!loading.geo" class="charts-container">
            <div class="chart-card full-width">
              <h3>Concentration des commandes en France</h3>
              <div class="map-legend">
                <p><strong>Légende :</strong></p>
                <p><i class="fas fa-map-marker-alt" style="color: blue;"></i> Marqueur : emplacement exact de la ville</p>
                <p><i class="fas fa-circle" style="color: red;"></i> Cercle rouge : zone de concentration des commandes</p>
                <p>La taille du cercle est proportionnelle au nombre de commandes (300m par commande, maximum 5km)</p>
              </div>
            </div>
          </div>
        </div>
        
        <div id="hidden-map-container" class="hidden-map-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch, onUnmounted } from 'vue';
import { nextTick } from 'vue';
import api from '@/services/apiService';
import * as echarts from 'echarts/core';
import { configureZoomOptions } from '@/utils/chartUtils';

const tabs = [
  { name: 'Utilisateurs' },
  { name: 'Commandes' },
  { name: 'Produits' },
  { name: 'Chiffre d\'affaires' },
  { name: 'Géolocalisation' }
];
const activeTab = ref(0);

const loading = ref({
  users: false,
  orders: false,
  products: false,
  revenue: false,
  geo: false
});

// Variables pour Leaflet
let map = null;
let markers = [];
const geoData = ref([]);
const groupedGeoData = ref([]); // Données regroupées par préfixe de code postal
const expandedGroups = ref({}); // Suivi des groupes qui ont été dégroupés

const userData = ref([]);

const userSignupsOptions = computed(() => ({
  title: {
    text: 'Inscriptions par jour',
    left: 'center',
    textStyle: {
      fontWeight: 'normal',
      fontSize: 16
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  toolbox: {
    feature: {
      saveAsImage: {}
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: userData.value.map(item => item.date),
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: {
    type: 'value',
    name: 'Nombre d\'inscriptions'
  },
  series: [
    {
      name: 'Inscriptions',
      type: 'bar',
      data: userData.value.map(item => item.count),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#2378f7' },
            { offset: 1, color: '#83bff6' }
          ])
        }
      }
    }
  ],
  animationDuration: 2000
}));

const userGrowthOptions = ref({});

const updateUserGrowthOptions = (data) => {
  userGrowthOptions.value = {
    title: {
      text: 'Évolution des inscriptions',
      left: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    toolbox: {
      feature: {
        dataZoom: {},
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Nombre total d\'utilisateurs'
    },
    series: [
      {
        name: 'Total utilisateurs',
        type: 'line',
        data: data.map(item => item.total),
        smooth: true,
        lineStyle: {
          width: 3,
          shadowColor: 'rgba(0,0,0,0.3)',
          shadowBlur: 10,
          shadowOffsetY: 8
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(145, 204, 117, 0.8)' },
            { offset: 1, color: 'rgba(145, 204, 117, 0.1)' }
          ])
        },
        markPoint: {
          data: [
            { type: 'max', name: 'Maximum' }
          ]
        }
      }
    ],
    animationDuration: 2000
  };
};

const orderDailyOptions = ref({});
const orderGrowthOptions = ref({});
const orderStatusOptions = ref({});
const orderValueOptions = ref({});
const orderRevenueOptions = ref({});

const revenueDailyOptions = ref({});
const revenueGrowthOptions = ref({});

const orderData = ref([]);
const revenueData = ref([]);

const productTopOptions = ref({});
const productCategoryOptions = ref({});
const categorySalesOptions = ref({});
const productStockOptions = ref({});

const productData = ref([]);
const categoryData = ref([]);

const fetchUserData = async () => {
  loading.value.users = true;
  
  try {
    const response = await api.get('/user/all');
    
    if (response.data && (Array.isArray(response.data.data) || Array.isArray(response.data))) {
      const users = Array.isArray(response.data.data) ? response.data.data : response.data;
      
      const usersByDate = {};
      users.forEach(user => {
        if (user.createdAt) {
          const date = new Date(user.createdAt).toLocaleDateString('fr-FR');
          if (!usersByDate[date]) {
            usersByDate[date] = [];
          }
          usersByDate[date].push(user);
        }
      });
      
      const formattedData = [];
      Object.keys(usersByDate).forEach(date => {
        formattedData.push({
          date: date,
          count: usersByDate[date].length,
          total: 0
        });
      });
      
      if (formattedData.length === 0) {
        formattedData.push({
          date: 'Total',
          count: users.length,
          total: users.length
        });
      } else {
        formattedData.sort((a, b) => {
          const dateA = new Date(a.date.split('/').reverse().join('-'));
          const dateB = new Date(b.date.split('/').reverse().join('-'));
          return dateA - dateB;
        });
        
        let total = 0;
        for (let i = 0; i < formattedData.length; i++) {
          total += formattedData[i].count;
          formattedData[i].total = total;
        }
      }
      
      userData.value = formattedData;
      updateUserGrowthOptions(formattedData);
    } else {
      console.error('Format de données utilisateurs inattendu:', response.data);
    }
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateurs:', error);
  } finally {
    loading.value.users = false;
  }
};

const generateMockUserData = () => {
  const data = [];
  const today = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    let count = Math.floor(Math.random() * 10);
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      count += Math.floor(Math.random() * 6);
    }
    
    if (dayOfMonth >= 25) {
      count += Math.floor(Math.random() * 5);
    }
    
    data.push({
      date: date.toLocaleDateString('fr-FR'),
      count,
      total: 0
    });
  }
  
  let total = 0;
  for (let i = 0; i < data.length; i++) {
    total += data[i].count;
    data[i].total = total;
  }
  
  return data;
};

const fetchOrderData = async () => {
  loading.value.orders = true;
  try {
    // Modification pour récupérer toutes les commandes sans limite
    const response = await api.get('/orders/all');
    
    if (response.data && (Array.isArray(response.data.data) || Array.isArray(response.data))) {
      const orders = Array.isArray(response.data.data) ? response.data.data : response.data;
      
      const formattedData = [];
      
      const ordersByDate = {};
      orders.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString('fr-FR');
        if (!ordersByDate[date]) {
          ordersByDate[date] = [];
        }
        ordersByDate[date].push(order);
      });
      
      Object.keys(ordersByDate).forEach(date => {
        const ordersForDate = ordersByDate[date];
        
        let totalAmount = 0;
        ordersForDate.forEach(order => {
          if (order.totalPrice) {
            totalAmount += parseFloat(order.totalPrice);
          }
        });
        
        const avgAmount = ordersForDate.length > 0 ? totalAmount / ordersForDate.length : 0;
        
        formattedData.push({
          date: date,
          count: ordersForDate.length,
          total: 0,
          totalAmount: totalAmount,
          avgAmount: avgAmount
        });
      });
      
      formattedData.sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateA - dateB;
      });
      
      let total = 0;
      for (let i = 0; i < formattedData.length; i++) {
        total += formattedData[i].count;
        formattedData[i].total = total;
      }
      
      orderData.value = formattedData;
      
      updateOrderDailyOptions(formattedData);
      updateOrderGrowthOptions(formattedData);
      updateOrderStatusOptions(orders);
      updateOrderValueOptions(formattedData);
      updateOrderRevenueOptions(formattedData);
    } else {
      console.error('Format de données commandes inattendu:', response.data);
    }
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données de commandes:', error);
  } finally {
    loading.value.orders = false;
  }
};

const generateMockOrderData = () => {
  const data = [];
  const today = new Date();
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const dailyOrders = Math.floor(Math.random() * 15) + 5;
    let dailyTotal = 0;
    
    const ordersByStatus = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    const dailyOrdersDetails = [];
    for (let j = 0; j < dailyOrders; j++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const amount = Math.floor(Math.random() * 300) + 50;
      
      ordersByStatus[status]++;
      dailyTotal += amount;
      
      dailyOrdersDetails.push({
        id: `ORD-${date.getFullYear()}${date.getMonth()+1}${date.getDate()}-${j}`,
        status,
        amount
      });
    }
    
    data.push({
      date: date.toLocaleDateString('fr-FR'),
      count: dailyOrders,
      total: 0,
      amount: dailyTotal,
      avgAmount: dailyTotal / dailyOrders,
      orders: dailyOrdersDetails,
      ordersByStatus
    });
  }
  
  let total = 0;
  for (let i = 0; i < data.length; i++) {
    total += data[i].count;
    data[i].total = total;
  }
  
  return data;
};

const updateOrderDailyOptions = (data) => {
  const options = {
    title: {
      text: 'Commandes par jour',
      left: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    toolbox: {
      feature: {
        dataZoom: {},
        saveAsImage: {}
      }
    },
    legend: {
      data: ['Nombre de commandes', 'Montant total (€)']
    },
    xAxis: [
      {
        type: 'category',
        data: data.map(item => item.date),
        axisLabel: {
          rotate: 45
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Nombre',
        position: 'left'
      },
      {
        type: 'value',
        name: 'Montant (€)',
        position: 'right'
      }
    ],
    series: [
      {
        name: 'Nombre de commandes',
        type: 'bar',
        yAxisIndex: 0,
        data: data.map(item => item.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#5470c6' },
            { offset: 1, color: '#91cc75' }
          ])
        }
      },
      {
        name: 'Montant total (€)',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(item => item.totalAmount ? Math.round(item.totalAmount * 100) / 100 : 0),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: '#ee6666'
        }
      }
    ],
    animationDuration: 2000
  };
  
  orderDailyOptions.value = configureZoomOptions(options);
};

const updateOrderGrowthOptions = (data) => {
  const options = {
    title: {
      text: 'Évolution des commandes',
      left: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    toolbox: {
      feature: {
        dataZoom: {},
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Nombre total de commandes'
    },
    series: [
      {
        name: 'Total commandes',
        type: 'line',
        data: data.map(item => item.total),
        smooth: true,
        lineStyle: {
          width: 3,
          shadowColor: 'rgba(0,0,0,0.3)',
          shadowBlur: 10,
          shadowOffsetY: 8
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(128, 128, 220, 0.8)' },
            { offset: 1, color: 'rgba(128, 128, 220, 0.1)' }
          ])
        },
        markPoint: {
          data: [
            { type: 'max', name: 'Maximum' }
          ]
        }
      }
    ],
    animationDuration: 2000
  };
  
  orderGrowthOptions.value = configureZoomOptions(options);
};

const updateOrderStatusOptions = (orders = []) => {
  const statusCounts = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  };
  
  if (orders && orders.length > 0) {
    orders.forEach(order => {
      const status = order.status || 'pending';
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
    });
  } else {
    orderData.value.forEach(day => {
      if (day.ordersByStatus) {
        Object.keys(day.ordersByStatus).forEach(status => {
          statusCounts[status] += day.ordersByStatus[status];
        });
      }
    });
  }
  
  const statusLabels = {
    pending: 'En attente',
    processing: 'En traitement',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée'
  };
  
  const statusColors = {
    pending: '#fac858',
    processing: '#5470c6',
    shipped: '#91cc75',
    delivered: '#3ba272',
    cancelled: '#ee6666'
  };
  
  orderStatusOptions.value = {
    title: {
      text: 'Répartition des commandes par statut',
      left: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: Object.keys(statusCounts).map(key => statusLabels[key])
    },
    series: [
      {
        name: 'Statut',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '60%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: Object.keys(statusCounts).map(key => ({
          value: statusCounts[key],
          name: statusLabels[key],
          itemStyle: {
            color: statusColors[key]
          }
        }))
      }
    ],
    animationDuration: 2000
  };
};

const updateOrderValueOptions = (data) => {
  const hasAmountData = data.some(item => item.avgAmount !== undefined || item.totalAmount !== undefined);
  
  const options = {
    title: {
      text: 'Valeur moyenne des commandes',
      left: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const date = params[0].name;
        const value = params[0].value;
        return `${date}: ${value ? value.toFixed(2) : '0.00'}€`;
      }
    },
    toolbox: {
      feature: {
        dataZoom: {},
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}€'
      }
    },
    series: [
      {
        name: 'Valeur moyenne',
        type: 'line',
        data: data.map(item => item.avgAmount),
        markPoint: {
          data: [
            { type: 'max', name: 'Max' },
            { type: 'min', name: 'Min' }
          ]
        },
        markLine: {
          data: [
            { type: 'average', name: 'Moyenne' }
          ]
        },
        itemStyle: {
          color: '#8e44ad'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(142, 68, 173, 0.8)'
            },
            {
              offset: 1,
              color: 'rgba(142, 68, 173, 0.1)'
            }
          ])
        },
        smooth: true
      }
    ],
    animationDuration: 2000
  };
  orderValueOptions.value = configureZoomOptions(options);
};

const updateOrderRevenueOptions = (data) => {
  const options = {
    title: {
      text: 'Chiffre d\'affaires par jour',
      left: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: (params) => {
        const date = params[0].name;
        const revenue = params[0].value;
        return `${date}<br/>Chiffre d'affaires: ${revenue.toFixed(2)}€`;
      }
    },
    toolbox: {
      feature: {
        dataZoom: {},
        saveAsImage: {}
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Chiffre d\'affaires (€)',
      axisLabel: {
        formatter: '{value}€'
      }
    },
    series: [
      {
        name: 'Chiffre d\'affaires',
        type: 'bar',
        data: data.map(item => Math.round(item.totalAmount * 100) / 100),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ],
    animationDuration: 2000
  };
};

const fetchProductData = async () => {
  loading.value.products = true;
  
  try {
    const productsResponse = await api.get('/products');
    const categoriesResponse = await api.get('/categories');
    
    const ordersResponse = await api.get('/orders?limit=1000');
        
    let products = [];
    let categories = [];
    let orders = [];
    
    if (productsResponse.data) {
      products = Array.isArray(productsResponse.data.data) 
        ? productsResponse.data.data 
        : Array.isArray(productsResponse.data) 
          ? productsResponse.data 
          : [];
    }
    
    if (categoriesResponse.data) {
      categories = Array.isArray(categoriesResponse.data.data) 
        ? categoriesResponse.data.data 
        : Array.isArray(categoriesResponse.data) 
          ? categoriesResponse.data 
          : [];
    }
    
    if (ordersResponse.data) {
      orders = Array.isArray(ordersResponse.data.data) 
        ? ordersResponse.data.data 
        : Array.isArray(ordersResponse.data) 
          ? ordersResponse.data 
          : [];
    }
    
    productData.value = products;
    categoryData.value = categories;
    
    const productSales = {};
    const categorySales = {};
    
    
    orders.forEach(order => {
      if (order.orderItems && Array.isArray(order.orderItems)) {
        
        order.orderItems.forEach(item => {
          
          if (!item.product) {
            return;
          }
          
          let productObj = item.product;
          if (typeof item.product === 'string') {
            productObj = products.find(p => p._id === item.product);
            if (!productObj) {
              return;
            }
          } else if (typeof item.product !== 'object') {
            return;
          }
          
          const productId = productObj._id;
          if (!productSales[productId]) {
            productSales[productId] = {
              id: productId,
              name: productObj.name || 'Produit sans nom',
              quantity: 0,
              revenue: 0
            };
          }
          productSales[productId].quantity += item.qty || 0;
          productSales[productId].revenue += (item.price || 0) * (item.qty || 0);
          
          if (productObj.category) {
            const categoryId = typeof productObj.category === 'object' 
              ? productObj.category._id 
              : productObj.category;
              
              
            if (!categorySales[categoryId]) {
              const category = categories.find(c => c._id === categoryId);
              
              categorySales[categoryId] = {
                id: categoryId,
                name: category ? category.name : 'Catégorie inconnue',
                quantity: 0,
                revenue: 0
              };
            }
            categorySales[categoryId].quantity += item.qty || 0;
            categorySales[categoryId].revenue += (item.price || 0) * (item.qty || 0);
          }
        });
      }
    });
        
    updateProductTopOptions(Object.values(productSales));
    updateCategorySalesOptions(Object.values(categorySales));
    
    const categoryDistribution = {};
    products.forEach(product => {
      if (product.category) {
        const categoryId = typeof product.category === 'object' 
          ? product.category._id 
          : product.category;
          
        if (!categoryDistribution[categoryId]) {
          const category = categories.find(c => c._id === categoryId);
          categoryDistribution[categoryId] = {
            id: categoryId,
            name: category ? category.name : 'Catégorie inconnue',
            count: 0
          };
        }
        categoryDistribution[categoryId].count++;
      }
    });
    
    updateProductCategoryOptions(Object.values(categoryDistribution));
    
    const stockLevels = [
      { name: 'Stock critique (0-5)', count: 0, color: '#ee6666' },
      { name: 'Stock bas (6-20)', count: 0, color: '#fac858' },
      { name: 'Stock normal (21-50)', count: 0, color: '#91cc75' },
      { name: 'Stock élevé (51+)', count: 0, color: '#5470c6' }
    ];
        
    products.forEach(product => {
      const stock = parseInt(product.stock) || 0;
      if (stock <= 5) {
        stockLevels[0].count++;
      } else if (stock <= 20) {
        stockLevels[1].count++;
      } else if (stock <= 50) {
        stockLevels[2].count++;
      } else {
        stockLevels[3].count++;
      }
    });
    
    updateProductStockOptions(stockLevels);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données produits:', error);
  } finally {
    loading.value.products = false;
  }
};

const updateProductTopOptions = (data) => {
  
  if (data.length === 0) {
    productTopOptions.value = {
      title: {
        text: 'Produits les plus vendus',
        left: 'center',
        textStyle: {
          fontWeight: 'normal',
          fontSize: 16
        },
        subtext: 'Aucune donnée disponible'
      },
      series: []
    };
    return;
  }
  
  const sortedData = [...data].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  
  productTopOptions.value = {
    title: {
      text: 'Produits les plus vendus',
      left: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const data = params[0];
        return `${data.name}<br/>Quantité vendue: ${data.value}<br/>CA: ${sortedData[data.dataIndex].revenue.toFixed(2)}€`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: sortedData.map(item => item.name),
      axisLabel: {
        rotate: 45,
        interval: 0,
        textStyle: {
          fontSize: 10
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Quantité vendue'
    },
    series: [
      {
        name: 'Quantité vendue',
        type: 'bar',
        data: sortedData.map(item => item.quantity),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2378f7' },
              { offset: 0.7, color: '#2378f7' },
              { offset: 1, color: '#83bff6' }
            ])
          }
        }
      }
    ],
    animationDuration: 2000
  };
};

const updateProductCategoryOptions = (data) => {  
  if (data.length === 0) {
    productCategoryOptions.value = {
      title: {
        text: 'Répartition des produits par catégorie',
        left: 'center',
        textStyle: {
          fontWeight: 'normal',
          fontSize: 16
        },
        subtext: 'Aucune donnée disponible'
      },
      series: []
    };
    return;
  }
  
  productCategoryOptions.value = {
    title: {
      text: 'Répartition des produits par catégorie',
      left: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: data.map(item => item.name)
    },
    series: [
      {
        name: 'Catégories',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '60%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map((item, index) => {
          const colors = [
            '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
            '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#c23531'
          ];
          return {
            value: item.count,
            name: item.name,
            itemStyle: {
              color: colors[index % colors.length]
            }
          };
        })
      }
    ],
    animationDuration: 2000
  };
};

const updateCategorySalesOptions = (data) => {  
  if (data.length === 0) {
    categorySalesOptions.value = {
      title: {
        text: 'Ventes par catégorie',
        left: 'center',
        textStyle: {
          fontWeight: 'normal',
          fontSize: 16
        },
        subtext: 'Aucune donnée disponible'
      },
      series: []
    };
    return;
  }
  
  const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);
  
  categorySalesOptions.value = {
    title: {
      text: 'Ventes par catégorie',
      left: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const data = params[0];
        return `${data.name}<br/>CA: ${data.value.toFixed(2)}€<br/>Quantité: ${sortedData[data.dataIndex].quantity}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: sortedData.map(item => item.name),
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: 'Chiffre d\'affaires (€)',
      axisLabel: {
        formatter: '{value}€'
      }
    },
    series: [
      {
        name: 'Chiffre d\'affaires',
        type: 'bar',
        data: sortedData.map(item => Math.round(item.revenue * 100) / 100),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#91cc75' },
            { offset: 1, color: '#5470c6' }
          ])
        }
      }
    ],
    animationDuration: 2000
  };
};

const updateProductStockOptions = (data) => {  
  const hasData = data.some(item => item.count > 0);
  if (!hasData) {
    productStockOptions.value = {
      title: {
        text: 'Niveau de stock des produits',
        left: 'center',
        textStyle: {
          fontWeight: 'normal',
          fontSize: 16
        },
        subtext: 'Aucune donnée disponible'
      },
      series: []
    };
    return;
  }
  
  const filteredData = data.filter(item => item.count > 0);
  
  productStockOptions.value = {
    title: {
      text: 'Niveau de stock des produits',
      left: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} produits ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: data.map(item => item.name)
    },
    series: [
      {
        name: 'Niveau de stock',
        type: 'pie',
        radius: '70%',
        center: ['50%', '60%'],
        data: filteredData.map(item => ({
          value: item.count,
          name: item.name,
          itemStyle: {
            color: item.color
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ],
    animationDuration: 2000
  };
};

const fetchRevenueData = async () => {
  loading.value.revenue = true;
  
  try {
    const ordersResponse = await api.get('/orders?limit=1000');
        
    let orders = [];
    
    
    if (ordersResponse.data) {
      if (ordersResponse.data.success && Array.isArray(ordersResponse.data.data)) {
        orders = ordersResponse.data.data;
      } else if (Array.isArray(ordersResponse.data)) {
        orders = ordersResponse.data;
      } else if (ordersResponse.data.data && Array.isArray(ordersResponse.data.data)) {
        orders = ordersResponse.data.data;
      } else {
        orders = [];
      }
    }
    
    
    const revenueByDay = {};
    const cumulativeRevenue = [];
    let totalRevenue = 0;
    
    orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    orders.forEach(order => {
      if (order.isPaid) {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        
        if (!revenueByDay[date]) {
          revenueByDay[date] = 0;
        }
        revenueByDay[date] += order.totalPrice || 0;
        
        totalRevenue += order.totalPrice || 0;
        cumulativeRevenue.push({
          date,
          total: totalRevenue
        });
      }
    });
    
    const revenueDaily = Object.keys(revenueByDay).map(date => ({
      date,
      revenue: revenueByDay[date]
    }));
    
    revenueData.value = {
      daily: revenueDaily,
      cumulative: cumulativeRevenue
    };
    
    updateRevenueDailyOptions(revenueDaily);
    updateRevenueGrowthOptions(cumulativeRevenue);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données du chiffre d\'affaires:', error);
  } finally {
    loading.value.revenue = false;
  }
};

const updateRevenueDailyOptions = (data) => {
  
  if (data.length === 0) {
    revenueDailyOptions.value = {
      title: {
        text: 'Chiffre d\'affaires par jour',
        left: 'center',
        textStyle: {
          fontWeight: 'normal',
          fontSize: 16
        },
        subtext: 'Aucune donnée disponible'
      },
      series: []
    };
    return;
  }
  
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  revenueDailyOptions.value = {
    title: {
      text: 'Chiffre d\'affaires par jour',
      left: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    formatter: (params) => {
        const date = params[0].name;
        const revenue = params[0].value;
        return `${date}<br/>Chiffre d'affaires: ${revenue.toFixed(2)}€`;
    },
    toolbox: {
      feature: {
        dataZoom: {},
        saveAsImage: {}
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: sortedData.map(item => item.date),
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: 'Chiffre d\'affaires (€)',
      axisLabel: {
        formatter: '{value}€'
      }
    },
    series: [
      {
        name: 'Chiffre d\'affaires',
        type: 'bar',
        data: sortedData.map(item => Math.round(item.revenue * 100) / 100),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#91cc75' },
            { offset: 1, color: '#5470c6' }
          ])
        }
      }
    ],
    animationDuration: 2000
  };
  revenueDailyOptions.value = configureZoomOptions(revenueDailyOptions.value);
};

const updateRevenueGrowthOptions = (data) => {
  
  if (data.length === 0) {
    revenueGrowthOptions.value = {
      title: {
        text: 'Évolution du chiffre d\'affaires',
        left: 'center',
        textStyle: {
          fontWeight: 'normal',
          fontSize: 16
        },
        subtext: 'Aucune donnée disponible'
      },
      series: []
    };
    return;
  }
  
  revenueGrowthOptions.value = {
    title: {
      text: 'Évolution du chiffre d\'affaires',
      left: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const date = params[0].name;
        const total = params[0].value;
        return `${date}<br/>Total cumulé: ${total.toFixed(2)}€`;
      }
    },
    toolbox: {
      feature: {
        dataZoom: {},
        saveAsImage: {}
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Chiffre d\'affaires cumulé (€)',
      axisLabel: {
        formatter: '{value}€'
      }
    },
    series: [
      {
        name: 'Chiffre d\'affaires cumulé',
        type: 'line',
        data: data.map(item => Math.round(item.total * 100) / 100),
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(84, 112, 198, 0.8)' },
            { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
          ])
        },
        lineStyle: {
          width: 2,
          color: '#5470c6'
        },
        itemStyle: {
          color: '#5470c6'
        }
      }
    ],
    animationDuration: 2000
  };
};

const loadLeaflet = () => {
  return new Promise((resolve, reject) => {
    console.log('Vérification de Leaflet:', window.L ? 'Déjà chargé' : 'Non chargé');
    
    if (window.L) {
      console.log('Leaflet est déjà chargé, version:', window.L.version);
      resolve(window.L);
      return;
    }
    
    const existingCss = document.querySelector('link[href*="leaflet.css"]');
    const existingJs = document.querySelector('script[src*="leaflet.js"]');
    
    if (!existingCss) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    if (!existingJs) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => resolve(window.L);
      script.onerror = (error) => reject(error);
      document.head.appendChild(script);
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        if (window.L) {
          clearInterval(interval);
          resolve(window.L);
        } else if (attempts >= 30) {
          clearInterval(interval);
          reject(new Error('Leaflet n\'a pas pu être chargé après plusieurs tentatives'));
        }
        attempts++;
      }, 100);
    }
  });
};

const waitForElement = (selector, maxAttempts = 10, interval = 200) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkElement = () => {
      const element = document.getElementById(selector);
      if (element) {
        console.log(`Élément ${selector} trouvé après ${attempts + 1} tentatives`);
        resolve(element);
        return;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        console.error(`Élément ${selector} non trouvé après ${maxAttempts} tentatives`);
        reject(new Error(`Élément ${selector} non trouvé`));
        return;
      }
      
      console.log(`Tentative ${attempts + 1}/${maxAttempts} de trouver l'élément ${selector}...`);
      setTimeout(checkElement, interval);
    };
    
    checkElement();
  });
};

const initMap = async () => {
  loading.value.geo = true;
  
  try {
    if (activeTab.value !== 4) {
      loading.value.geo = false;
      return;
    }
    
    // S'assurer que Vue a mis à jour le DOM
    await nextTick();
    
    // Attendre que le conteneur existe avec plusieurs tentatives
    const mapContainer = await waitForElement('map-container', 15, 200).catch(error => {
      console.error('Erreur lors de la recherche du conteneur:', error);
      return null;
    });
    
    if (!mapContainer) {
      console.error('Le conteneur map-container n\'existe pas après plusieurs tentatives');
      loading.value.geo = false;
      return;
    }
    
    console.log('Conteneur de carte trouvé:', mapContainer);
    
    if (map) {
      map.remove();
      map = null;
      markers = [];
    }
    
    map = L.map('map-container', {
      zoomControl: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      dragging: true,
      tap: true,
      keyboard: true,
      inertia: true
    }).setView([46.2276, 2.2137], 6);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);
    
    map.invalidateSize(true);
    
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    if (map.tap) map.tap.enable();
        
    await new Promise(resolve => setTimeout(resolve, 500));
    
    fetchGeoData().then(result => {
      groupedGeoData.value = result.groupedData;
      geoData.value = result.detailedData;
      
      try {
        if (markers.length > 0) {
          markers.forEach(marker => map.removeLayer(marker));
          markers = [];
        }
        
        if (!map) {
          console.error('La carte n\'est pas initialisée');
          return;
        }        
        
        if (groupedGeoData.value && groupedGeoData.value.length > 0) {
          const showDetailedMarkers = (groupPrefix) => {
            expandedGroups.value[groupPrefix] = true;
            
            const detailedItems = geoData.value.filter(item => item.postalPrefix === groupPrefix);
            
            detailedItems.forEach(item => {
              addDetailedMarker(item);
            });
            
            const groupMarkerToRemove = markers.find(m => m.groupId === `group-${groupPrefix}`);
            if (groupMarkerToRemove) {
              map.removeLayer(groupMarkerToRemove);
              markers = markers.filter(m => m.groupId !== `group-${groupPrefix}`);
            }
          };
          
          const addDetailedMarker = (item) => {
            const marker = L.marker([item.lat, item.lng])
              .addTo(map)
              .bindPopup(
                `<div style="font-family: Arial, sans-serif; padding: 5px;">
                  <h3 style="margin: 0 0 5px 0; color: #333;">${item.name}</h3>
                  ${item.postalCode ? `<p style="margin: 0 0 5px 0; color: #666;">Code postal: ${item.postalCode}</p>` : ''}
                  <p style="margin: 0 0 5px 0;"><b>Commandes:</b> ${item.count}</p>
                  <p style="margin: 0;"><b>Montant total:</b> ${Math.round(item.amount * 100) / 100}€</p>
                </div>`
              );
            
            markers.push(marker);
            
            try {
              const radius = Math.min(Math.max(item.count * 300, 1000), 5000);
              const circle = L.circle([item.lat, item.lng], {
                radius: radius,
                color: '#FF0000',
                fillColor: '#FF0000',
                fillOpacity: 0.2,
                weight: 1,
                interactive: false
              }).addTo(map);
              
              markers.push(circle);
            } catch (circleErr) {
              console.error(`Erreur lors de l'ajout du cercle pour ${item.name}:`, circleErr);
            }
          };
          
          groupedGeoData.value.forEach((group, index) => {
            try {
              if (expandedGroups.value[group.postalPrefix]) {
                const detailedItems = geoData.value.filter(item => item.postalPrefix === group.postalPrefix);
                detailedItems.forEach(item => {
                  addDetailedMarker(item);
                });
                return;
              }
              
              const groupIcon = L.divIcon({
                html: `<div style="background-color: #3388ff; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; font-weight: bold;">${group.count}</div>`,
                className: 'custom-div-icon',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              });
              
              const marker = L.marker([group.lat, group.lng], { icon: groupIcon })
                .addTo(map)
                .bindPopup(
                  `<div style="font-family: Arial, sans-serif; padding: 5px;">
                    <h3 style="margin: 0 0 5px 0; color: #333;">${group.name}</h3>
                    <p style="margin: 0 0 5px 0;"><b>Nombre de commandes:</b> ${group.count}</p>
                    <p style="margin: 0 0 5px 0;"><b>Montant total:</b> ${Math.round(group.amount * 100) / 100}€</p>
                    <p style="margin: 0 0 5px 0;"><b>Nombre de villes:</b> ${group.cities.length}</p>
                    <button id="expand-${group.postalPrefix}" style="background-color: #3388ff; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Voir le détail</button>
                  </div>`
                );
              
              marker.groupId = `group-${group.postalPrefix}`;
              
              marker.on('popupopen', () => {
                setTimeout(() => {
                  const expandButton = document.getElementById(`expand-${group.postalPrefix}`);
                  if (expandButton) {
                    expandButton.addEventListener('click', () => {
                      showDetailedMarkers(group.postalPrefix);
                    });
                  }
                }, 100);
              });
              
              markers.push(marker);
              
              try {
                const radius = Math.min(Math.max(group.count * 200, 3000), 20000);
                const circle = L.circle([group.lat, group.lng], {
                  radius: radius,
                  color: '#3388ff',
                  fillColor: '#3388ff',
                  fillOpacity: 0.2,
                  weight: 1,
                  interactive: false
                }).addTo(map);
                
                circle.groupId = `group-${group.postalPrefix}`;
                markers.push(circle);
              } catch (circleErr) {
                console.error(`Erreur lors de l'ajout du cercle pour ${group.name}:`, circleErr);
              }
            } catch (err) {
              console.error(`Erreur lors de l'ajout du marqueur ${index + 1}:`, err);
            }
          });

          setTimeout(() => {
            try {
              const swCorner = window.L.latLng(41.3, -5.5); // Sud-ouest
              const neCorner = window.L.latLng(51.1, 9.5);  // Nord-est
              const bounds = window.L.latLngBounds(swCorner, neCorner);
              
              map.fitBounds(bounds);
              
              setTimeout(() => {
                const currentZoom = map.getZoom();
                map.setZoom(currentZoom - 1);
              }, 500);
            } catch (err) {
              console.error('Erreur lors de l\'ajustement de la vue:', err);
              map.setView([46.2276, 2.2137], 5);
            }
          }, 1000);
        } else {
          console.log('Aucune donnée géographique disponible');
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des marqueurs:', error);
      } finally {
        loading.value.geo = false;
      }
    }).catch(error => {
      console.error('Erreur lors du chargement des données géographiques:', error);
      loading.value.geo = false;
    });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la carte:', error);
    loading.value.geo = false;
  }
};

const cityCoordinates = {
  'paris': { lat: 48.8566, lng: 2.3522 },
  'marseille': { lat: 43.2965, lng: 5.3698 },
  'lyon': { lat: 45.75, lng: 4.85 },
  'toulouse': { lat: 43.6043, lng: 1.4437 },
  'nice': { lat: 43.7102, lng: 7.262 },
  'nantes': { lat: 47.2184, lng: -1.5536 },
  'strasbourg': { lat: 48.5734, lng: 7.7521 },
  'montpellier': { lat: 43.6108, lng: 3.8767 },
  'bordeaux': { lat: 44.8378, lng: -0.5792 },
  'lille': { lat: 50.6292, lng: 3.0573 },
  'rennes': { lat: 48.1173, lng: -1.6778 },
  'reims': { lat: 49.2628, lng: 4.0347 },
  'le havre': { lat: 49.4944, lng: 0.1079 },
  'saint-étienne': { lat: 45.4397, lng: 4.3872 },
  'toulon': { lat: 43.1242, lng: 5.9279 },
  'grenoble': { lat: 45.1885, lng: 5.7245 },
  'dijon': { lat: 47.3216, lng: 5.0415 },
  'angers': { lat: 47.4784, lng: -0.5632 },
  'nimes': { lat: 43.8367, lng: 4.3601 },
  'villeurbanne': { lat: 45.7679, lng: 4.8812 },
  
  '75': { lat: 48.8566, lng: 2.3522, name: 'Paris' },
  '77': { lat: 48.6, lng: 2.9, name: 'Seine-et-Marne' },
  '78': { lat: 48.8, lng: 1.9, name: 'Yvelines' },
  '91': { lat: 48.5, lng: 2.2, name: 'Essonne' },
  '92': { lat: 48.9, lng: 2.2, name: 'Hauts-de-Seine' },
  '93': { lat: 48.9, lng: 2.4, name: 'Seine-Saint-Denis' },
  '94': { lat: 48.8, lng: 2.5, name: 'Val-de-Marne' },
  '95': { lat: 49.1, lng: 2.1, name: 'Val-d\'Oise' },
  '13': { lat: 43.5, lng: 5.1, name: 'Bouches-du-Rhône' },
  '69': { lat: 45.8, lng: 4.8, name: 'Rhône' },
  '31': { lat: 43.6, lng: 1.4, name: 'Haute-Garonne' },
  '06': { lat: 43.9, lng: 7.2, name: 'Alpes-Maritimes' },
  '44': { lat: 47.3, lng: -1.6, name: 'Loire-Atlantique' },
  '67': { lat: 48.6, lng: 7.5, name: 'Bas-Rhin' },
  '34': { lat: 43.6, lng: 3.4, name: 'Hérault' },
  '33': { lat: 44.8, lng: -0.6, name: 'Gironde' },
  '59': { lat: 50.5, lng: 3.1, name: 'Nord' },
  '35': { lat: 48.1, lng: -1.7, name: 'Ille-et-Vilaine' },
  '51': { lat: 48.9, lng: 4.2, name: 'Marne' },
  '76': { lat: 49.6, lng: 1.0, name: 'Seine-Maritime' },
  '42': { lat: 45.7, lng: 4.1, name: 'Loire' },
  '83': { lat: 43.5, lng: 6.2, name: 'Var' },
  '38': { lat: 45.3, lng: 5.6, name: 'Isère' },
  '21': { lat: 47.3, lng: 4.8, name: 'Côte-d\'Or' },
  '49': { lat: 47.4, lng: -0.6, name: 'Maine-et-Loire' },
  '30': { lat: 43.9, lng: 4.2, name: 'Gard' },
  
  '75001': { lat: 48.8637, lng: 2.3400, name: 'Paris 1er' },
  '75002': { lat: 48.8698, lng: 2.3422, name: 'Paris 2e' },
  '75003': { lat: 48.8637, lng: 2.3615, name: 'Paris 3e' },
  '75004': { lat: 48.8543, lng: 2.3527, name: 'Paris 4e' },
  '75005': { lat: 48.8448, lng: 2.3524, name: 'Paris 5e' },
  '75006': { lat: 48.8495, lng: 2.3364, name: 'Paris 6e' },
  '75007': { lat: 48.8574, lng: 2.3161, name: 'Paris 7e' },
  '75008': { lat: 48.8728, lng: 2.3149, name: 'Paris 8e' },
  '75009': { lat: 48.8765, lng: 2.3374, name: 'Paris 9e' },
  '75010': { lat: 48.8768, lng: 2.3591, name: 'Paris 10e' },
  '75011': { lat: 48.8586, lng: 2.3784, name: 'Paris 11e' },
  '75012': { lat: 48.8399, lng: 2.3875, name: 'Paris 12e' },
  '75013': { lat: 48.8322, lng: 2.3561, name: 'Paris 13e' },
  '75014': { lat: 48.8304, lng: 2.3263, name: 'Paris 14e' },
  '75015': { lat: 48.8402, lng: 2.2962, name: 'Paris 15e' },
  '75016': { lat: 48.8614, lng: 2.2752, name: 'Paris 16e' },
  '75017': { lat: 48.8835, lng: 2.3093, name: 'Paris 17e' },
  '75018': { lat: 48.8925, lng: 2.3444, name: 'Paris 18e' },
  '75019': { lat: 48.8827, lng: 2.3827, name: 'Paris 19e' },
  '75020': { lat: 48.8652, lng: 2.3990, name: 'Paris 20e' },
  
  '13001': { lat: 43.2976, lng: 5.3810, name: 'Marseille 1er' },
  '13002': { lat: 43.3047, lng: 5.3659, name: 'Marseille 2e' },
  '13003': { lat: 43.3101, lng: 5.3780, name: 'Marseille 3e' },
  '69001': { lat: 45.7697, lng: 4.8322, name: 'Lyon 1er' },
  '69002': { lat: 45.7575, lng: 4.8320, name: 'Lyon 2e' },
  '69003': { lat: 45.7597, lng: 4.8590, name: 'Lyon 3e' },
  '31000': { lat: 43.6045, lng: 1.4440, name: 'Toulouse' },
  '06000': { lat: 43.7031, lng: 7.2661, name: 'Nice' },
  '44000': { lat: 47.2172, lng: -1.5533, name: 'Nantes' }
};

const geocodeAddress = (address) => {
  try {
    if (!address) {
      console.error('Adresse manquante');
      return { lat: 48.8566, lng: 2.3522 }; // Paris par défaut
    }
    
    if (address.postalCode) {
      const exactPostalCode = address.postalCode;
      if (cityCoordinates[exactPostalCode]) {
        console.log(`Coordonnées trouvées pour le code postal exact ${exactPostalCode}`);
        return cityCoordinates[exactPostalCode];
      }
      
      const deptCode = address.postalCode.substring(0, 2);
      if (cityCoordinates[deptCode]) {
        console.log(`Coordonnées trouvées pour le département ${deptCode}`);
        return cityCoordinates[deptCode];
      }
    }
    
    if (address.city) {
      const cityLower = address.city.toLowerCase();
      if (cityCoordinates[cityLower]) {
        console.log(`Coordonnées trouvées pour la ville ${cityLower}`);
        return cityCoordinates[cityLower];
      }
    }
    
    console.log(`Aucune correspondance trouvée pour ${address.city || ''} (${address.postalCode || ''}), utilisation des coordonnées par défaut`);
    return { lat: 48.8566, lng: 2.3522 }; // Paris par défaut
  } catch (error) {
    console.error('Erreur lors du géocodage de l\'adresse:', error);
    return { lat: 48.8566, lng: 2.3522 }; // Paris par défaut
  }
};

const fetchGeoData = async () => {
  try {
    const ordersResponse = await api.get('/orders/all');
    
    let orders = [];
    
    if (ordersResponse.data) {
      
      if (ordersResponse.data.success && ordersResponse.data.data) {
        orders = ordersResponse.data.data;
      } else if (Array.isArray(ordersResponse.data)) {
        orders = ordersResponse.data;
      } else {
        orders = [];
      }
    }
    
    
    if (orders.length > 0) {
      for (let i = 0; i < Math.min(3, orders.length); i++) {
        
        if (orders[i].shippingAddress) {
          console.log(`Adresse de livraison:`, orders[i].shippingAddress);
          console.log(`Structure de l'adresse:`, Object.keys(orders[i].shippingAddress));
        } else {
          console.log('Pas d\'adresse de livraison pour cette commande');
          
          if (orders[i].shipping) {
            console.log('Champ shipping trouvé:', orders[i].shipping);
          }
          if (orders[i].address) {
            console.log('Champ address trouvé:', orders[i].address);
          }
          if (orders[i].deliveryAddress) {
            console.log('Champ deliveryAddress trouvé:', orders[i].deliveryAddress);
          }
        }
      }
      
      const withAddress = orders.filter(order => order.shippingAddress).length;
      console.log(`${withAddress}/${orders.length} commandes ont une adresse de livraison`);
    } else {
      console.log('Aucune commande trouvée');
    }
    
    const postalPrefixData = {};
    
    const cityData = {};
    let validOrderCount = 0;
    
    const getShippingAddress = (order) => {
      if (order.shippingAddress) {
        return order.shippingAddress;
      } else if (order.shipping && order.shipping.address) {
        return order.shipping.address;
      } else if (order.deliveryAddress) {
        return order.deliveryAddress;
      } else if (order.address) {
        return order.address;
      }
      return null;
    };
    
    orders.forEach((order, index) => {
      const shippingAddress = getShippingAddress(order);
      
      if (!shippingAddress) {
        return;
      }
      
      const city = shippingAddress.city || shippingAddress.ville;
      const postalCode = shippingAddress.postalCode || shippingAddress.zipCode || shippingAddress.codePostal;
      
      if (!city || !postalCode) {
        return;
      }
      
      validOrderCount++;
      
      const cityKey = `${city}-${postalCode}`;
      
      const postalPrefix = postalCode.substring(0, 2);
      
      if (!cityData[cityKey]) {
        cityData[cityKey] = {
          city,
          postalCode,
          address: {
            city,
            postalCode,
            addressLine1: shippingAddress.addressLine1 || shippingAddress.address || '',
            country: shippingAddress.country || 'France'
          },
          count: 0,
          totalAmount: 0,
          orders: [],
          postalPrefix: postalPrefix
        };
      }
      
      cityData[cityKey].count++;
      cityData[cityKey].totalAmount += order.totalPrice || order.amount || 0;
      cityData[cityKey].orders.push(order);
      
      if (!postalPrefixData[postalPrefix]) {
        postalPrefixData[postalPrefix] = {
          prefix: postalPrefix,
          name: `Zone ${postalPrefix}`,
          count: 0,
          totalAmount: 0,
          cities: [],
          citiesData: {}
        };
      }
      
      postalPrefixData[postalPrefix].count++;
      postalPrefixData[postalPrefix].totalAmount += order.totalPrice || order.amount || 0;
      
      if (!postalPrefixData[postalPrefix].citiesData[cityKey]) {
        postalPrefixData[postalPrefix].citiesData[cityKey] = cityData[cityKey];
        postalPrefixData[postalPrefix].cities.push(cityKey);
      }
    });
        
    const mappedData = [];
    const groupedData = [];
    
    const prefixes = Object.values(postalPrefixData);
    
    for (const prefixInfo of prefixes) {
      const coordinates = cityCoordinates[prefixInfo.prefix] || { lat: 48.8566, lng: 2.3522 };
      
      groupedData.push({
        id: `group-${prefixInfo.prefix}`,
        name: `Zone ${prefixInfo.prefix}`,
        postalPrefix: prefixInfo.prefix,
        lat: coordinates.lat,
        lng: coordinates.lng,
        count: prefixInfo.count,
        amount: prefixInfo.totalAmount,
        isGroup: true,
        cities: prefixInfo.cities,
        citiesData: prefixInfo.citiesData
      });
    }
    
    const cities = Object.values(cityData);
    
    for (const cityInfo of cities) {
      const coordinates = geocodeAddress(cityInfo.address);
      
      mappedData.push({
        id: `${cityInfo.city}-${cityInfo.postalCode}`,
        name: `${cityInfo.city}`,
        postalCode: cityInfo.postalCode,
        postalPrefix: cityInfo.postalPrefix,
        lat: coordinates.lat,
        lng: coordinates.lng,
        count: cityInfo.count,
        amount: cityInfo.totalAmount,
        isGroup: false
      });
    }
    
    if (groupedData.length === 0) {
      groupedData.push({
        id: 'group-75',
        name: 'Zone 75',
        postalPrefix: '75',
        lat: 48.8566,
        lng: 2.3522,
        count: 1,
        amount: 0,
        isGroup: true,
        cities: [],
        citiesData: {}
      });
    }
    
    return {
      groupedData,
      detailedData: mappedData
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données de géolocalisation:', error);
    return [];
  }
};

onMounted(() => {
  fetchUserData();
  fetchOrderData();
  fetchProductData();
  fetchRevenueData();
  
  if (activeTab.value === 4) {
    setTimeout(() => {
      initMap();
    }, 1500);
  }
  
  watch(activeTab, (newTab) => {
    if (newTab === 1 && !orderData.value.length) {
      fetchOrderData();
    } else if (newTab === 2 && !productData.value.length) {
      fetchProductData();
    } else if (newTab === 3 && !revenueData.value.daily) {
      fetchRevenueData();
    } else if (newTab === 4) {
      if (map) {
        map.remove();
        map = null;
        markers = [];
      }
      
      loading.value.geo = true;
      
      nextTick(() => {
        setTimeout(() => {
          if (activeTab.value === 4) {
            initMap();
          }
        }, 500);
      });
    }
  });
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

declare global {
  interface Window {
    L: any;
  }
}
</script>

<style scoped>
.statistics-view {
  padding: 20px;
}

h1 {
  margin-bottom: 30px;
  color: #333;
}

.tabs-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabs {
  display: flex;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.tab {
  padding: 15px 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.tab:hover {
  background: #e9e9e9;
}

.tab.active {
  background: #fff;
  border-bottom: 3px solid #4a90e2;
  color: #4a90e2;
}

.tab-content {
  padding: 20px;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.chart {
  height: 400px;
  width: 100%;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 18px;
  color: #666;
}

.full-width {
  grid-column: 1 / -1;
}

.map-container {
  height: 800px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid #cccccc;
  position: relative;
}

/* Styles de base pour Leaflet */
.leaflet-container {
  height: 100%;
  width: 100%;
}

/* Supprimer toutes les règles pointer-events personnalisées */
.leaflet-interactive {
  /* Laisser Leaflet gérer les interactions par défaut */
}

/* Supprimer les styles personnalisés des contrôles de zoom */
.leaflet-control-zoom {
  /* Laisser Leaflet gérer les styles par défaut */
}

.leaflet-control-zoom a {
  /* Laisser Leaflet gérer les styles par défaut */
}

.map-legend {
  margin-top: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  font-size: 14px;
}

.hidden-map-container {
  position: absolute;
  width: 800px; /* Augmenter la largeur */
  height: 800px; /* Augmenter la hauteur */
  visibility: hidden;
  z-index: -1;
  opacity: 0;
  pointer-events: none;
}
</style>
