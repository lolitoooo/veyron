const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    default: 'Adresse'
  },
  firstName: {
    type: String,
    required: [true, 'Veuillez ajouter un prénom']
  },
  lastName: {
    type: String,
    required: [true, 'Veuillez ajouter un nom']
  },
  addressLine1: {
    type: String,
    required: [true, 'Veuillez ajouter une adresse']
  },
  addressLine2: {
    type: String
  },
  city: {
    type: String,
    required: [true, 'Veuillez ajouter une ville']
  },
  postalCode: {
    type: String,
    required: [true, 'Veuillez ajouter un code postal']
  },
  country: {
    type: String,
    required: [true, 'Veuillez ajouter un pays']
  },
  phone: {
    type: String,
    required: [true, 'Veuillez ajouter un numéro de téléphone']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['shipping', 'billing', 'both'],
    default: 'both'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Address', AddressSchema);