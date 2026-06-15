# Paramètres de connexion
$neo4jUrl = "http://localhost:7474/db/neo4j/tx/commit"
$username = "neo4j"
$password = "Klm2025!"
$authHeader = ("Authorization", ("Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$username`:$password"))))

# Requête Cypher pour importer un fichier GraphML
$query = @"
CALL apoc.import.graphml("mon_export.graphml", {readLabels:true, storeNodeIds:false}) 
YIELD nodes, relationships, properties 
RETURN nodes, relationships, properties
"@

# Préparer le body JSON pour l'API Neo4j
$body = @{
    statements = @(
        @{
            statement = $query
        }
    )
} | ConvertTo-Json -Depth 5

# Exécuter la requête via HTTP POST
$response = Invoke-RestMethod -Uri $neo4jUrl -Method Post -Headers @{ $authHeader[0] = $authHeader[1] } -Body $body -ContentType "application/json"

# Afficher le résultat
$response
