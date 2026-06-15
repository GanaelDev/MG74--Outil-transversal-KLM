# MG74 – Plateforme de Gestion et Visualisation de Connaissances Métier

Ce projet propose une plateforme complète pour la gestion, la visualisation et l'import/export de graphes de connaissances métier, basée sur des fichiers JSON structurés, Neo4j et un visualisateur web interactif.

## Structure du projet

- **Data/** :
  - Fichiers JSON métier (ex : `Cuisine.json`, `maison_inclusive.json`, etc.)
  - Script Python `jsonToCypher.py` pour convertir un JSON métier en requêtes Cypher importables dans Neo4j.
- **jsonVisualisationTool/** :
  - Application web React/TypeScript pour visualiser et explorer les graphes issus des fichiers JSON.
  - Visualisation interactive (drag & drop, détails des nœuds, navigation graphique).
- **neo4jDocker/** :
  - Scripts PowerShell et Bash pour lancer Neo4j en conteneur Docker, importer/exporter des graphes (Cypher, GraphML), et automatiser les opérations courantes.
- **Diagrammes** :
  - `BPMN_MG74.puml` : diagramme BPMN du processus global.
  - `class-diagram.puml` : diagramme de classes du modèle de données métier.

## Fonctionnalités principales

- **Import de connaissances** :
  - Écrire ou modifier un fichier JSON métier dans `Data/`.
  - Convertir ce JSON en Cypher avec `jsonToCypher.py`.
  - Importer le Cypher dans Neo4j via Docker avec `import-cypher.ps1`.
- **Visualisation** :
  - Lancer l'application web dans `jsonVisualisationTool/` pour explorer le graphe de connaissances (voir section suivante).
- **Export** :
  - Exporter le graphe complet depuis Neo4j (JSON ou GraphML) via les scripts fournis.

## Démarrage rapide

### 1. Lancer Neo4j (Docker)

Le démarrage se fait avec Docker Compose (identique sur Windows, Linux et Mac) :

```bash
cd neo4jDocker
docker compose up -d
```

- Interface web : http://localhost:7474 — utilisateur `neo4j`, mot de passe `Klm2025!`
- Les données sont **persistantes** (volumes Docker), elles survivent à un redémarrage.
- Paramètres modifiables dans `neo4jDocker/.env` (utilisateur, mot de passe, version).

Importer les données initiales (`data.cypher`) — à faire **une seule fois** :
```bash
docker compose --profile import up import
```

Autres commandes utiles :
```bash
docker compose down       # arrêter Neo4j (conserve les données)
docker compose down -v    # tout supprimer, y compris les données (reset complet)
docker compose logs -f neo4j   # suivre les logs
```

### 2. Importer un fichier JSON métier dans Neo4j

- Placer votre fichier JSON dans `Data/` (ex : `Cuisine.json`).
- Convertir en Cypher :
  ```bash
  cd Data
  python jsonToCypher.py
  ```
- Importer dans Neo4j :
  ```powershell
  cd ../neo4jDocker
  ./import-cypher.ps1 -cypherFile ../Data/Cuisine.cypher
  ```

### 3. Visualiser le graphe métier

```bash
cd jsonVisualisationTool
npm install
npm run dev
```
- Ouvrir le navigateur à l'adresse indiquée (généralement http://localhost:5173/).
- Charger un fichier JSON métier pour explorer le graphe.

## Schémas et modèles

- **Diagramme BPMN** : décrit le processus global d'import, visualisation, export et mise à jour des connaissances (`BPMN_MG74.puml`).
- **Diagramme de classes** : structure des entités métier et leurs relations (`class-diagram.puml`).

## Dépendances principales
- [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [vis-network](https://visjs.github.io/vis-network/)
- [Neo4j](https://neo4j.com/) (via Docker)

## Personnalisation et extension
- Les modèles JSON sont adaptables à d'autres domaines métier.
- Le script Python peut être enrichi pour supporter de nouveaux types de relations ou d'entités.
- L'application web peut être personnalisée (UI, interactions, etc.).

## Auteurs & Contact
- Projet MG74 – UTBM 2024-2025
- Pour toute question ou suggestion, ouvrez une issue ou contactez l'équipe pédagogique.
