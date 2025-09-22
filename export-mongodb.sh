#!/bin/bash

# Chemin vers le dossier de dump
DUMP_PATH="./mongodb_dump"

# Créer le dossier s'il n'existe pas
mkdir -p $DUMP_PATH

# Vérifier si le conteneur MongoDB est en cours d'exécution
if ! docker ps | grep -q veyron-mongodb; then
  echo "Le conteneur MongoDB n'est pas en cours d'exécution. Démarrez-le avec 'docker compose up -d mongodb'"
  exit 1
fi

echo "Création d'un dump depuis le conteneur Docker MongoDB..."

# Créer le dump dans le conteneur
docker exec veyron-mongodb mongodump --username admin --password password --authenticationDatabase admin --db veyron --out /tmp/dump

# Copier le dump du conteneur vers l'hôte
docker cp veyron-mongodb:/tmp/dump $DUMP_PATH

# Nettoyer le dump temporaire dans le conteneur
docker exec veyron-mongodb rm -rf /tmp/dump

echo "Exportation terminée ! Les fichiers sont dans le dossier $DUMP_PATH/dump/veyron"
echo "Vous pouvez maintenant utiliser ces dumps pour restaurer les données avec ./restore-custom-dump.sh"
echo "Les fichiers importants sont les fichiers .bson et .json dans le dossier $DUMP_PATH/dump/veyron"
