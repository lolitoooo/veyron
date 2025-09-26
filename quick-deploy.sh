#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 {prod|preprod|both}"
    echo "  prod   - Déploie uniquement l'environnement de production"
    echo "  preprod - Déploie uniquement l'environnement de préproduction"
    echo "  both   - Déploie les deux environnements"
    exit 1
fi

install_prerequisites() {
    log "Installation des prérequis..."
    
    sudo apt update
    sudo apt upgrade -y
    
    if ! command -v docker &> /dev/null; then
        log "Installation de Docker..."
        sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
        curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -
        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
        sudo apt update
        sudo apt install -y docker-ce
        sudo systemctl start docker
        sudo systemctl enable docker
    else
        log "Docker est déjà installé."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log "Installation de Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    else
        log "Docker Compose est déjà installé."
    fi
    
    if ! command -v nginx &> /dev/null; then
        log "Installation de Nginx..."
        sudo apt install -y nginx
        sudo systemctl start nginx
        sudo systemctl enable nginx
    else
        log "Nginx est déjà installé."
    fi
    
    if ! command -v certbot &> /dev/null; then
        log "Installation de Certbot..."
        sudo apt install -y certbot python3-certbot-nginx
    else
        log "Certbot est déjà installé."
    fi
    
    log "Installation des prérequis terminée."
}

setup_nginx() {
    log "Configuration de Nginx..."
    
    sudo cp nginx/veyron.conf /etc/nginx/sites-available/veyron.conf
    
    sudo ln -sf /etc/nginx/sites-available/veyron.conf /etc/nginx/sites-enabled/veyron.conf
    
    sudo rm -f /etc/nginx/sites-enabled/default
    
    sudo nginx -t
    
    sudo systemctl restart nginx
    
    log "Configuration de Nginx terminée."
}

setup_ssl() {
    log "Configuration SSL avec Let's Encrypt..."
    
    sudo certbot --nginx -d veyron-paris.fr
    
    sudo certbot --nginx -d preprod.veyron-paris.fr
    
    log "Configuration SSL terminée."
}

deploy_prod() {
    log "Déploiement de la production..."
    
    docker-compose -f docker-compose.prod.yml down
    
    docker-compose -f docker-compose.prod.yml build
    
    docker-compose -f docker-compose.prod.yml up -d
    
    log "Production déployée avec succès!"
}

deploy_preprod() {
    log "Déploiement de la préproduction..."
    
    docker-compose -f docker-compose.preprod.yml down
    
    docker-compose -f docker-compose.preprod.yml build
    
    docker-compose -f docker-compose.preprod.yml up -d
    
    log "Préproduction déployée avec succès!"
}

install_prerequisites

setup_nginx
setup_ssl

case "$1" in
    prod)
        deploy_prod
        ;;
    preprod)
        deploy_preprod
        ;;
    both)
        deploy_prod
        deploy_preprod
        ;;
    *)
        error "Argument invalide: $1"
        echo "Usage: $0 {prod|preprod|both}"
        exit 1
        ;;
esac

log "Déploiement terminé!"
log "Production: https://veyron-paris.fr"
log "Préproduction: https://preprod.veyron-paris.fr:8443"
