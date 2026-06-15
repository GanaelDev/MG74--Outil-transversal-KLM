#!/bin/bash
# Vérifie si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé ou n'est pas dans le PATH." >&2
    exit 1
fi

# Paramètres Neo4j
neo4jUser="neo4j"  # Nom d'utilisateur
neo4jPassword="Klm2025!"  # Mot de passe sécurisé
containerName="neo4j-klm"
version="5.19"

# Supprime l'ancien conteneur s'il existe
if [ "$(docker ps -a --filter "name=$containerName" --format "{{.Names}}")" = "$containerName" ]; then
    echo "Suppression de l'ancien conteneur $containerName..."
    docker rm -f "$containerName"
fi

echo "Création et démarrage du conteneur Neo4j..."
docker run -d -p 7474:7474 -p 7687:7687 --name "$containerName" -e NEO4J_AUTH="$neo4jUser/$neo4jPassword" neo4j:"$version"

echo "Neo4j est lancé sur http://localhost:7474 (user: $neo4jUser, mot de passe: $neo4jPassword)"

# Après le démarrage du conteneur Neo4j, importer automatiquement data.cypher dans le conteneur principal

# Attendre que Neo4j soit prêt (boucle sur cypher-shell)
maxAttempts=20
attempt=0
while [ $attempt -lt $maxAttempts ]; do
    docker exec -i "$containerName" cypher-shell -u "$neo4jUser" -p "$neo4jPassword" --encryption false "RETURN 1;" 2>&1 | grep -qE '1' && break
    sleep 3
    attempt=$((attempt+1))
done

echo "Import automatique de data.cypher dans Neo4j via Docker..."
scriptDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cypherFile="$scriptDir/data.cypher"
cat "$cypherFile" | docker exec -i "$containerName" cypher-shell -u "$neo4jUser" -p "$neo4jPassword" --encryption false
echo "Import terminé."

echo "Neo4j devrait être disponible dans moins d'une minute. Merci de patienter..."