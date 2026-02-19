#!/bin/bash

# Script d'installation automatique pour ntfy + GlitchTip
# Usage: ./setup.sh

set -e

echo "🚀 Installation ntfy.sh + GlitchTip pour Veyron"
echo "================================================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Ce script doit être exécuté en tant que root${NC}"
  echo "Utilisez: sudo ./setup.sh"
  exit 1
fi

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker et Docker Compose détectés${NC}"

# Vérifier Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠ Nginx n'est pas installé. Installation...${NC}"
    apt update && apt install -y nginx
fi

echo -e "${GREEN}✓ Nginx détecté${NC}"

# Vérifier Certbot
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}⚠ Certbot n'est pas installé. Installation...${NC}"
    apt update && apt install -y certbot python3-certbot-nginx
fi

echo -e "${GREEN}✓ Certbot détecté${NC}"

# Demander les domaines
echo ""
echo "Configuration des domaines:"
read -p "Domaine pour ntfy (ex: ntfy.veyron-paris.fr): " NTFY_DOMAIN
read -p "Domaine pour GlitchTip (ex: glitchtip.veyron-paris.fr): " GLITCHTIP_DOMAIN

# Générer les secrets
echo ""
echo "Génération des secrets..."
GLITCHTIP_SECRET_KEY=$(openssl rand -hex 32)
GLITCHTIP_DB_PASSWORD=$(openssl rand -base64 32)

echo -e "${GREEN}✓ Secrets générés${NC}"

# Demander l'email
read -p "Email pour les certificats SSL: " SSL_EMAIL

# Créer la structure de dossiers
echo ""
echo "Création de la structure de dossiers..."
mkdir -p /opt/monitoring/{ntfy/{cache,config},glitchtip/{postgres-data,redis-data,uploads},nginx}
cd /opt/monitoring

# Créer le fichier .env
echo ""
echo "Création du fichier .env..."
cat > .env << EOF
GLITCHTIP_DB_PASSWORD=${GLITCHTIP_DB_PASSWORD}
GLITCHTIP_SECRET_KEY=${GLITCHTIP_SECRET_KEY}
EMAIL_URL=smtp://contact@veyron-paris.fr:LolitoP77!@smtp.mail.ovh.net:587
NTFY_DOMAIN=${NTFY_DOMAIN}
GLITCHTIP_DOMAIN=${GLITCHTIP_DOMAIN}
EOF

echo -e "${GREEN}✓ Fichier .env créé${NC}"

# Copier les configurations Nginx
echo ""
echo "Configuration de Nginx..."

# Config ntfy
cat > /etc/nginx/sites-available/${NTFY_DOMAIN} << 'EOF'
upstream ntfy_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name NTFY_DOMAIN_PLACEHOLDER;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name NTFY_DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/NTFY_DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/NTFY_DOMAIN_PLACEHOLDER/privkey.pem;

    location / {
        proxy_pass http://ntfy_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 3m;
        proxy_send_timeout 3m;
        proxy_read_timeout 3m;
        proxy_buffering off;
        client_max_body_size 20m;
    }
}
EOF

sed -i "s/NTFY_DOMAIN_PLACEHOLDER/${NTFY_DOMAIN}/g" /etc/nginx/sites-available/${NTFY_DOMAIN}

# Config GlitchTip
cat > /etc/nginx/sites-available/${GLITCHTIP_DOMAIN} << 'EOF'
upstream glitchtip_backend {
    server 127.0.0.1:8001;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name GLITCHTIP_DOMAIN_PLACEHOLDER;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name GLITCHTIP_DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/GLITCHTIP_DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/GLITCHTIP_DOMAIN_PLACEHOLDER/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://glitchtip_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sed -i "s/GLITCHTIP_DOMAIN_PLACEHOLDER/${GLITCHTIP_DOMAIN}/g" /etc/nginx/sites-available/${GLITCHTIP_DOMAIN}

# Activer les sites
ln -sf /etc/nginx/sites-available/${NTFY_DOMAIN} /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/${GLITCHTIP_DOMAIN} /etc/nginx/sites-enabled/

# Tester la config Nginx
nginx -t

echo -e "${GREEN}✓ Nginx configuré${NC}"

# Obtenir les certificats SSL
echo ""
echo "Obtention des certificats SSL..."
systemctl stop nginx

certbot certonly --standalone -d ${NTFY_DOMAIN} --email ${SSL_EMAIL} --agree-tos --non-interactive
certbot certonly --standalone -d ${GLITCHTIP_DOMAIN} --email ${SSL_EMAIL} --agree-tos --non-interactive

systemctl start nginx

echo -e "${GREEN}✓ Certificats SSL obtenus${NC}"

# Lancer les services Docker
echo ""
echo "Lancement des services Docker..."

# Note: Le docker-compose.monitoring.yml doit être présent dans /opt/monitoring
if [ ! -f "docker-compose.monitoring.yml" ]; then
    echo -e "${RED}❌ Fichier docker-compose.monitoring.yml non trouvé${NC}"
    echo "Veuillez copier le fichier dans /opt/monitoring"
    exit 1
fi

docker-compose -f docker-compose.monitoring.yml --env-file .env up -d

echo -e "${GREEN}✓ Services Docker lancés${NC}"

# Attendre que GlitchTip soit prêt
echo ""
echo "Attente du démarrage de GlitchTip..."
sleep 30

# Créer le superuser GlitchTip
echo ""
echo "Création du compte admin GlitchTip..."
echo "Suivez les instructions ci-dessous:"
docker exec -it glitchtip-web ./manage.py createsuperuser

# Résumé
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Installation terminée avec succès!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "📝 Informations importantes:"
echo ""
echo "🔔 ntfy:"
echo "   URL: https://${NTFY_DOMAIN}"
echo "   Topics recommandés:"
echo "   - veyron-orders (nouvelles commandes)"
echo "   - veyron-alerts (erreurs critiques)"
echo "   - veyron-returns (demandes de retour)"
echo ""
echo "🐛 GlitchTip:"
echo "   URL: https://${GLITCHTIP_DOMAIN}"
echo "   Connectez-vous avec le compte créé ci-dessus"
echo "   Créez un projet et récupérez le DSN"
echo ""
echo "📱 Configuration iPhone:"
echo "   1. Installez l'app ntfy depuis l'App Store"
echo "   2. Configurez le serveur: https://${NTFY_DOMAIN}"
echo "   3. Abonnez-vous aux topics"
echo ""
echo "🔧 Prochaines étapes:"
echo "   1. Ajoutez NTFY_URL=https://${NTFY_DOMAIN} dans .env.production du backend"
echo "   2. Récupérez le DSN GlitchTip et ajoutez GLITCHTIP_DSN dans .env.production"
echo "   3. Redémarrez le backend: docker-compose restart backend"
echo ""
echo "📚 Documentation complète: /opt/monitoring/DEPLOYMENT.md"
echo ""
echo -e "${GREEN}Bon monitoring! 🚀${NC}"
