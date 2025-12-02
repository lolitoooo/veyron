#!/bin/bash

# Script de migration des images vers les volumes Docker
# À exécuter sur le VPS AVANT de recréer les conteneurs

set -e  # Arrêter en cas d'erreur

echo "🔄 Migration des images vers les volumes Docker..."

# 1. Vérifier que le conteneur backend existe
if ! docker ps -a | grep -q veyron-backend-1; then
    echo "❌ Conteneur backend non trouvé. Assurez-vous que les conteneurs sont démarrés."
    exit 1
fi

# 2. Créer un dossier de backup temporaire
echo "📦 Création du dossier de backup..."
mkdir -p /tmp/veyron_backup

# 3. Copier les images depuis le conteneur actuel
echo "📥 Copie des images depuis le conteneur..."
docker cp veyron-backend-1:/app/public/images /tmp/veyron_backup/ 2>/dev/null || echo "⚠️  Dossier images non trouvé"
docker cp veyron-backend-1:/app/public/uploads /tmp/veyron_backup/ 2>/dev/null || echo "⚠️  Dossier uploads non trouvé"

# 4. Compter les fichiers
IMAGE_COUNT=$(find /tmp/veyron_backup/images -type f 2>/dev/null | wc -l || echo "0")
UPLOAD_COUNT=$(find /tmp/veyron_backup/uploads -type f 2>/dev/null | wc -l || echo "0")

echo "📊 Fichiers trouvés:"
echo "   - Images: $IMAGE_COUNT"
echo "   - Uploads: $UPLOAD_COUNT"

# 5. Arrêter et recréer les conteneurs avec volumes
echo "🔄 Recréation des conteneurs avec volumes..."
docker-compose -f docker-compose.preprod.yml down
docker-compose -f docker-compose.preprod.yml up -d

# 6. Attendre que le conteneur soit prêt
echo "⏳ Attente du démarrage du conteneur..."
sleep 5

# 7. Copier les images dans les nouveaux volumes
if [ -d "/tmp/veyron_backup/images" ]; then
    echo "📤 Copie des images dans le nouveau volume..."
    docker cp /tmp/veyron_backup/images/. veyron-backend-1:/app/public/images/
fi

if [ -d "/tmp/veyron_backup/uploads" ]; then
    echo "📤 Copie des uploads dans le nouveau volume..."
    docker cp /tmp/veyron_backup/uploads/. veyron-backend-1:/app/public/uploads/
fi

# 8. Corriger les permissions
echo "🔐 Correction des permissions..."
docker exec veyron-backend-1 chown -R node:node /app/public/images 2>/dev/null || true
docker exec veyron-backend-1 chown -R node:node /app/public/uploads 2>/dev/null || true

# 9. Vérifier le résultat
echo "✅ Vérification..."
docker exec veyron-backend-1 ls -la /app/public/images | head -n 10
docker exec veyron-backend-1 ls -la /app/public/uploads | head -n 10

# 10. Nettoyer
echo "🧹 Nettoyage..."
rm -rf /tmp/veyron_backup

echo ""
echo "✅ Migration terminée !"
echo "📊 Résumé:"
echo "   - $IMAGE_COUNT images migrées"
echo "   - $UPLOAD_COUNT uploads migrés"
echo ""
echo "🎉 Les images sont maintenant persistées dans les volumes Docker !"
