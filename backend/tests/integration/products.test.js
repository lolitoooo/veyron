const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Product = require('../../models/Product');
const User = require('../../models/User');
const productRoutes = require('../../routes/products');

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

describe('Products API - Integration Tests', () => {
  let authToken;
  let adminToken;
  let testProduct;

  beforeEach(async () => {
    const user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'user@test.com',
      password: 'password123'
    });
    authToken = user.getSignedJwtToken();

    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    adminToken = admin.getSignedJwtToken();

    testProduct = await Product.create({
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      category: new mongoose.Types.ObjectId(),
      brand: 'Test Brand',
      stock: 10,
      images: [{
        url: 'test.jpg',
        alt: 'Test Product Image',
        isMain: true
      }],
      sizes: ['M'],
      colors: [{
        name: 'Blue',
        code: '#0000FF',
        images: []
      }]
    });
  });

  describe('GET /api/products', () => {
    it('devrait retourner la liste des produits', async () => {
      const res = await request(app)
        .get('/api/products')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('devrait supporter la pagination', async () => {
      await Product.create({
        name: 'Product 2',
        description: 'Description 2',
        price: 49.99,
        category: new mongoose.Types.ObjectId(),
        brand: 'Brand 2',
        stock: 5,
        images: [{
          url: 'test2.jpg',
          alt: 'Product 2 Image',
          isMain: true
        }],
        sizes: ['L'],
        colors: [{
          name: 'Red',
          code: '#FF0000',
          images: []
        }]
      });

      const res = await request(app)
        .get('/api/products?page=1&limit=1')
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/products/:id', () => {
    it('devrait retourner un produit par son ID', async () => {
      const res = await request(app)
        .get(`/api/products/${testProduct._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Product');
      expect(res.body.data.price).toBe(99.99);
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);
    });
  });

  describe('GET /api/products/search', () => {
    it('devrait rechercher des produits par nom', async () => {
      const res = await request(app)
        .get('/api/products/search?keyword=Test')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain('Test');
    });
  });

  describe('POST /api/products/:id/reviews', () => {
    it('devrait permettre à un utilisateur authentifié de créer une review', async () => {
      const res = await request(app)
        .post(`/api/products/${testProduct._id}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          comment: 'Excellent produit!'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('ajoutée');
    });

    it('devrait rejeter une review sans authentification', async () => {
      await request(app)
        .post(`/api/products/${testProduct._id}/reviews`)
        .send({
          rating: 5,
          comment: 'Test'
        })
        .expect(401);
    });
  });

  describe('POST /api/products (Admin)', () => {
    it('devrait permettre à un admin de créer un produit', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Product',
          description: 'New Description',
          price: 149.99,
          category: new mongoose.Types.ObjectId(),
          brand: 'New Brand',
          stock: 20,
          images: [{
            url: 'new.jpg',
            alt: 'New Product Image',
            isMain: true
          }],
          sizes: ['XL'],
          colors: [{
            name: 'Green',
            code: '#00FF00',
            images: []
          }]
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Product');
    });

    it('devrait rejeter la création par un utilisateur non-admin', async () => {
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Product',
          price: 99.99
        })
        .expect(403);
    });
  });

  describe('PUT /api/products/:id (Admin)', () => {
    it('devrait permettre à un admin de mettre à jour un produit', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product',
          price: 199.99
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Product');
      expect(res.body.data.price).toBe(199.99);
    });
  });

  describe('DELETE /api/products/:id (Admin)', () => {
    it('devrait permettre à un admin de supprimer un produit', async () => {
      await request(app)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deletedProduct = await Product.findById(testProduct._id);
      expect(deletedProduct).toBeNull();
    });
  });
});
