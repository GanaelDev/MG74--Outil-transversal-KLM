# jsonVisualisationTool

Ce projet est un visualisateur interactif de graphes à partir de fichiers JSON, développé avec React, TypeScript, Vite, Tailwind CSS et vis-network.

## Prérequis

- Node.js (version 18 ou supérieure recommandée)
- npm (généralement installé avec Node.js)

## Installation

1. **Cloner le dépôt** (ou placer les fichiers dans un dossier) :

```bash
# Exemple avec git
# git clone <url-du-repo>
cd jsonVisualisationTool
```

2. **Installer les dépendances** :

```bash
npm install
```

## Lancement du projet en mode développement

```bash
npm run dev
```

- Ouvrez ensuite votre navigateur à l'adresse indiquée (généralement http://localhost:5173/).

## Lancement via Docker (développement, hot-reload)

Permet de lancer le visualisateur sans installer Node localement, avec rechargement à chaud.

```bash
cd jsonVisualisationTool
docker compose up        # build l'image puis démarre Vite sur http://localhost:5173
docker compose down      # arrêter le conteneur
```

- Le code source est monté dans le conteneur : toute modification est rechargée automatiquement.
- Ouvrez http://localhost:5173 dans votre navigateur.

## Construction pour la production

```bash
npm run build
```

- Les fichiers optimisés seront générés dans le dossier `dist/`.

## Aperçu du build de production

```bash
npm run preview
```

## Linting (analyse statique du code)

```bash
npm run lint
```

## Fonctionnalités principales

- Chargement de fichiers JSON métier (drag & drop ou sélection)
- Visualisation interactive des relations sous forme de graphe
- Exploration des détails de chaque nœud
- Interface moderne avec Tailwind CSS

## Personnalisation

- Les données d'exemple sont dans `src/data/sampleData.ts`.
- Le code principal du graphe est dans `src/components/GraphVisualization.tsx`.

## Dépendances principales

- React
- TypeScript
- Vite
- Tailwind CSS
- vis-network
- lucide-react (icônes)

---

Pour toute question ou amélioration, ouvrez une issue ou contactez le développeur.
