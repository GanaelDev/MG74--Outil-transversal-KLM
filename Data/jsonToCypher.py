import json

# Charger le JSON
with open('Cuisine.json', 'r', encoding='utf-8') as f:
    data = json.load(f)


# Contraintes d'unicité pour éviter les doublons
cypher_lines = [
    "CREATE CONSTRAINT IF NOT EXISTS FOR (f:Filliere) REQUIRE f.nom IS UNIQUE;",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (d:Domaine) REQUIRE (d.nom, d.filiere) IS UNIQUE;",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (voc:Vocabulaire) REQUIRE (voc.id, voc.domaine) IS UNIQUE;",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (proc:Procedural) REQUIRE (proc.nom, proc.domaine) IS UNIQUE;",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (e:Etape) REQUIRE (e.numero, e.procedure) IS UNIQUE;",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (exp:ExpertiseMetier) REQUIRE (exp.nom, exp.domaine) IS UNIQUE;",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (r:Regle) REQUIRE (r.nom, r.expertise) IS UNIQUE;",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (ex:Experimental) REQUIRE (ex.nom, ex.domaine) IS UNIQUE;"
]

filliere = data['filliereMetier']
filliere_nom = filliere['nom']

# Créer la filière
cypher_lines.append(f"MERGE (f:Filliere {{nom: '{filliere_nom}'}})")

for domaine in filliere['domaineMetier']:
    domaine_nom = domaine['nom'].replace("'", "\\'")
    # Domaine unique par nom et filière
    cypher_lines.append(f"MERGE (d:Domaine {{nom: '{domaine_nom}', filiere: '{filliere_nom}'}})")
    cypher_lines.append(f"MATCH (f:Filliere {{nom: '{filliere_nom}'}}) MATCH (d:Domaine {{nom: '{domaine_nom}', filiere: '{filliere_nom}'}}) MERGE (f)-[:A_DOMAINE]->(d)")

    # Vocabulaire
    for v in domaine.get('Vocabulaire', []):
        v_id = v['id']
        v_nom = v['nom'].replace("'", "\\'")
        v_desc = v['description'].replace("'", "\\'")
        cypher_lines.append(f"MERGE (voc:Vocabulaire {{id: {v_id}, nom: '{v_nom}', description: '{v_desc}', domaine: '{domaine_nom}'}})")
        cypher_lines.append(f"MATCH (d:Domaine {{nom: '{domaine_nom}', filiere: '{filliere_nom}'}}), (voc:Vocabulaire {{id: {v_id}, domaine: '{domaine_nom}'}}) MERGE (d)-[:A_VOCABULAIRE]->(voc)")
        for lien in v.get('Lien', []):
            terme = lien['terme']
            ltype = lien['type']
            cypher_lines.append(f"MATCH (voc1:Vocabulaire {{id: {v_id}, domaine: '{domaine_nom}'}}), (voc2:Vocabulaire {{id: {terme}, domaine: '{domaine_nom}'}}) MERGE (voc1)-[:{ltype}]->(voc2)")

    # Procedural
    for p in domaine.get('Procedural', []):
        p_nom = p['nom'].replace("'", "\\'")
        p_desc = p['description'].replace("'", "\\'")
        cypher_lines.append(f"MERGE (proc:Procedural {{nom: '{p_nom}', description: '{p_desc}', domaine: '{domaine_nom}'}})")
        cypher_lines.append(f"MATCH (d:Domaine {{nom: '{domaine_nom}', filiere: '{filliere_nom}'}}), (proc:Procedural {{nom: '{p_nom}', domaine: '{domaine_nom}'}}) MERGE (d)-[:A_PROCEDURAL]->(proc)")
        for etape in p.get('etape', []):
            etape_num = etape['numero']
            etape_desc = etape['description'].replace("'", "\\'")
            cypher_lines.append(f"MERGE (e:Etape {{numero: '{etape_num}', description: '{etape_desc}', procedure: '{p_nom}'}})")
            cypher_lines.append(f"MATCH (proc:Procedural {{nom: '{p_nom}', domaine: '{domaine_nom}'}}), (e:Etape {{numero: '{etape_num}', procedure: '{p_nom}'}}) MERGE (proc)-[:A_ETAPE]->(e)")

    # ExpertiseMetier
    for exp in domaine.get('ExpertiseMetier', []):
        exp_nom = exp['nom'].replace("'", "\\'")
        exp_desc = exp['description'].replace("'", "\\'")
        cypher_lines.append(f"MERGE (exp:ExpertiseMetier {{nom: '{exp_nom}', description: '{exp_desc}', domaine: '{domaine_nom}'}})")
        cypher_lines.append(f"MATCH (d:Domaine {{nom: '{domaine_nom}', filiere: '{filliere_nom}'}}), (exp:ExpertiseMetier {{nom: '{exp_nom}', domaine: '{domaine_nom}'}}) MERGE (d)-[:A_EXPERTISE]->(exp)")
        for regle in exp.get('regles', []):
            regle_nom = regle['nom'].replace("'", "\\'")
            regle_type = regle['type']
            regle_expr = regle['expression'].replace("'", "\\'")
            cypher_lines.append(f"MERGE (r:Regle {{nom: '{regle_nom}', type: '{regle_type}', expression: '{regle_expr}', expertise: '{exp_nom}'}})")
            cypher_lines.append(f"MATCH (exp:ExpertiseMetier {{nom: '{exp_nom}', domaine: '{domaine_nom}'}}), (r:Regle {{nom: '{regle_nom}', expertise: '{exp_nom}'}}) MERGE (exp)-[:A_REGLE]->(r)")

    # Experimental
    for exp in domaine.get('Experimental', []):
        exp_nom = exp['nom'].replace("'", "\\'")
        exp_desc = exp['description'].replace("'", "\\'")
        exp_type = exp['type']
        cypher_lines.append(f"MERGE (ex:Experimental {{nom: '{exp_nom}', description: '{exp_desc}', type: '{exp_type}', domaine: '{domaine_nom}'}})")
        cypher_lines.append(f"MATCH (d:Domaine {{nom: '{domaine_nom}', filiere: '{filliere_nom}'}}), (ex:Experimental {{nom: '{exp_nom}', domaine: '{domaine_nom}'}}) MERGE (d)-[:A_EXPERIMENTAL]->(ex)")

# Écrire le fichier .cypher

# Ajout d'un point-virgule à chaque requête pour éviter les conflits de variables
with open('Cuisine.cypher', 'w', encoding='utf-8') as f:
    for line in cypher_lines:
        f.write(line + ';\n')

print("Conversion terminée. Fichier Cuisine.cypher généré.")
