#!/bin/bash

# Vérifier si un fichier JSON a été spécifié
if [ -z "$1" ]; then
  echo "Usage: $0 <chemin_vers_fichier_json> <nom_collection>"
  echo "Exemple: $0 ./users.json users"
  exit 1
fi

# Vérifier si un nom de collection a été spécifié
if [ -z "$2" ]; then
  echo "Vous devez spécifier un nom de collection"
  echo "Usage: $0 <chemin_vers_fichier_json> <nom_collection>"
  exit 1
fi

# Chemin vers le fichier JSON
JSON_FILE="$1"
COLLECTION="$2"

# Vérifier si le fichier existe
if [ ! -f "$JSON_FILE" ]; then
  echo "Le fichier $JSON_FILE n'existe pas"
  exit 1
fi

# Vérifier si le conteneur MongoDB est en cours d'exécution
if ! docker ps | grep -q veyron-mongodb; then
  echo "Le conteneur MongoDB n'est pas en cours d'exécution. Démarrez-le avec 'docker compose up -d mongodb'"
  exit 1
fi

echo "Importation du fichier JSON $JSON_FILE dans la collection $COLLECTION..."

# Copier le fichier JSON dans le conteneur
docker cp "$JSON_FILE" veyron-mongodb:/tmp/import.json

# Importer le fichier JSON dans MongoDB
# Vérifier si le fichier est un fichier metadata.json
if [[ "$JSON_FILE" == *".metadata.json" ]]; then
  echo "Le fichier est un fichier metadata.json, importation sans l'option --jsonArray"
  docker exec veyron-mongodb mongoimport --username admin --password password --authenticationDatabase admin --db veyron --collection "$COLLECTION" --file /tmp/import.json
else
  echo "Importation avec l'option --jsonArray"
  docker exec veyron-mongodb mongoimport --username admin --password password --authenticationDatabase admin --db veyron --collection "$COLLECTION" --file /tmp/import.json --jsonArray
fi

# Nettoyer le fichier temporaire
docker exec veyron-mongodb rm -f /tmp/import.json

echo "Importation terminée !"
echo "Vous pouvez vérifier les données avec: docker exec -it veyron-mongodb mongosh --username admin --password password --authenticationDatabase admin veyron"
echo "Exemple de commande pour vérifier les données: db.$COLLECTION.find()"
