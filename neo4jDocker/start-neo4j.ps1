# Arrêt du script en cas d'erreur
$ErrorActionPreference = 'Stop'

# Vérifie si Docker est installé
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker n'est pas installé ou n'est pas dans le PATH." -ForegroundColor Red
    exit 1
}

# Paramètres Neo4j
$neo4jUser = "neo4j"  # Nom d'utilisateur
$neo4jPassword = "Klm2025!"  # Mot de passe sécurisé
$containerName = "neo4j-klm"
$version = "5.19"

# Supprime l'ancien conteneur s'il existe
$container = docker ps -a --filter "name=$containerName" --format "{{.Names}}"
if ($container -eq $containerName) {
    Write-Host "Suppression de l'ancien conteneur $containerName..."
    docker rm -f $containerName
}

Write-Host "Création et démarrage du conteneur Neo4j avec APOC..."
# Utilisation de guillemets pour éviter les problèmes de parsing du mot de passe
$env:NEO4J_AUTH = "$neo4jUser/$neo4jPassword"
docker run -d -p 7474:7474 -p 7687:7687 --name $containerName -e NEO4J_AUTH="$env:NEO4J_AUTH" -e NEO4JLABS_PLUGINS='["apoc"]' -e NEO4J_apoc_import_file_enabled=true -e NEO4J_apoc_export_file_enabled=true neo4j:$version

# Attendre que Neo4j soit prêt (boucle sur cypher-shell)
$maxAttempts = 20
$attempt = 0
while ($attempt -lt $maxAttempts) {
    try {
        $test = docker exec -i $containerName cypher-shell -u $neo4jUser -p $neo4jPassword --encryption false "RETURN 1;" 2>&1
        if ($test -notmatch 'Connection refused|Failed to connect|ServiceUnavailable|error') { break }
    } catch {
        Write-Host "Erreur lors de la connexion à Neo4j, nouvelle tentative..." -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 3
    $attempt++
}
if ($attempt -ge $maxAttempts) {
    Write-Host "Échec du démarrage de Neo4j après $maxAttempts tentatives." -ForegroundColor Red
    exit 2
}

Write-Host "Neo4j est lancé sur http://localhost:7474 (user: $neo4jUser, mot de passe: $neo4jPassword)" -ForegroundColor Green