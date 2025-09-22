#!/bin/bash

# Récupérer le chemin du répertoire du script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Ouvrir un terminal dans le répertoire backend
osascript -e "tell application \"Terminal\" to do script \"cd '$DIR/backend' && node server.js\""

# Attendre quelques secondes
sleep 5

# Ouvrir un deuxième terminal dans le répertoire frontend
osascript -e "tell application \"Terminal\" to do script \"cd '$DIR/frontend' && npm run dev\""
