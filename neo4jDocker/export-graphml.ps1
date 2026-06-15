# Paramètres de connexion
$neo4jUrl = "http://localhost:7474/db/neo4j/tx/commit"
$username = "neo4j"
$password = "Klm2025!"
$authHeader = ("Authorization", ("Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$username`:$password"))))

# Requête Cypher pour exporter en GraphML
$query = @"
CALL apoc.export.graphml.all("mon_export.graphml", {useTypes:true, storeNodeIds:true}) 
YIELD file, nodes, relationships, properties, time 
RETURN file, nodes, relationships, properties, time
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
