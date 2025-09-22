#!/bin/bash

echo "Test de la route de base..."
curl http://localhost:3000/

echo -e "\n\nTest de la route de login..."
curl -X POST -H "Content-Type: application/json" -d '{"email":"loanpena77@gmail.com", "password":"Password123"}' http://localhost:3000/api/auth/login

echo -e "\n\nTest de la route d'inscription..."
curl -X POST -H "Content-Type: application/json" -d '{"firstName":"Test", "lastName":"User", "email":"test@example.com", "password":"Password123"}' http://localhost:3000/api/auth/register
