# Ce script importe un fichier Cypher dans Neo4j via Docker
param(
    [string]$cypherFile = "data.cypher",
    [string]$containerName = "neo4j-klm",
    [string]$neo4jUser = "neo4j",
    [string]$neo4jPassword = "Klm2025!"
)

$cypherPath = Join-Path $PSScriptRoot $cypherFile
if (Test-Path $cypherPath) {
    Write-Host "Importation de $cypherFile dans Neo4j..." -ForegroundColor Cyan
    $importResult = Get-Content $cypherPath | docker exec -i $containerName cypher-shell -u $neo4jUser -p $neo4jPassword --encryption false 2>&1
    Write-Host $importResult
    Write-Host "Importation terminée." -ForegroundColor Green
} else {
    Write-Host "Fichier $cypherFile introuvable dans le dossier du script." -ForegroundColor Yellow
}
