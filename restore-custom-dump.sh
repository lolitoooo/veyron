#!/bin/bash

# Chemin vers votre dump MongoDB
DUMP_PATH="./mongodb_dump/dump/veyron"

# Vérifier si le dossier de dump existe
if [ ! -d "$DUMP_PATH" ]; then
  echo "Le dossier de dump $DUMP_PATH n'existe pas."
  exit 1
fi

# Vérifier si le conteneur MongoDB est en cours d'exécution
if ! docker ps | grep -q veyron-mongodb; then
  echo "Le conteneur MongoDB n'est pas en cours d'exécution. Démarrez-le avec 'docker compose up -d mongodb'"
  exit 1
fi

echo "Restauration du dump MongoDB dans le conteneur Docker..."

# Copier le dump dans le conteneur
docker cp $DUMP_PATH veyron-mongodb:/tmp/dump_veyron

# Restaurer le dump dans MongoDB avec l'option --drop pour supprimer les collections existantes
docker exec veyron-mongodb mongorestore --username admin --password password --authenticationDatabase admin --db veyron --drop /tmp/dump_veyron

echo "Restauration terminée !"
echo "Vous pouvez vérifier les données avec: docker exec -it veyron-mongodb mongosh --username admin --password password --authenticationDatabase admin veyron"
echo "Exemple de commande pour vérifier les données: db.users.find()"
echo "Exemple de commande pour vérifier les collections: show collections"
