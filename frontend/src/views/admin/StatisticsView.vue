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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue';
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
      orders = Array.isArray(ordersResponse.data.data) 
        ? ordersResponse.data.data 
        : Array.isArray(ordersResponse.data) 
          ? ordersResponse.data 
          : [];
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

onMounted(() => {
  fetchUserData();
  fetchOrderData();
  fetchProductData();
  fetchRevenueData();
  
  watch(activeTab, (newTab) => {
    if (newTab === 1 && !orderData.value.length) {
      fetchOrderData();
    } else if (newTab === 2 && !productData.value.length) {
      fetchProductData();
    } else if (newTab === 3 && !revenueData.value.daily) {
      fetchRevenueData();
    }
  });
});
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
</style>
