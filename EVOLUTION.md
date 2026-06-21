# Évolution du projet — MG74 / Outil transversal KLM

Ce document récapitule tout ce qui a été réalisé **depuis la création du dépôt**, en
comparaison de l'**ancien état du projet**. Il sert de fil conducteur (rapport,
soutenance, reprise du projet).

> **Rappel du rôle du projet (KLM — Knowledge Lifecycle Management)**
> Les autres groupes modélisent des domaines métier précis (cuisine, smart city, santé…).
> Notre rôle transversal est de **centraliser et intégrer** ces graphes de connaissances :
> collecte → structuration → stockage → visualisation.

---

## 1. Ancien état du projet (point de départ)

### a. Le projet précédent (avant reprise)
D'après la présentation initiale :
- **Modèle de données incomplet** (JSON + UML).
- **Visualisation en arbre** uniquement.
- **Base de données injoignable depuis l'extérieur**.

### b. État du dépôt au commit initial (`52eb2ec`)
- Visualisateur **React + TypeScript + Vite + Tailwind + vis-network** affichant déjà un
  **graphe** (et non un arbre), mais alimenté **uniquement par fichiers JSON** (donnée
  exemple + import manuel d'un `.json`).
- **Aucun lien entre le visualisateur et Neo4j** (pas de `neo4j-driver`, pas de bouton de
  connexion).
- Neo4j démarré **manuellement** via des scripts `start-neo4j.ps1` / `start-neo4j.sh`.
- Un `data.cypher` de **démonstration partiel** (nœuds incomplets).
- Données métier JSON dans `Data/` + convertisseur `jsonToCypher.py` (mono-fichier).

---

## 2. Vue d'ensemble : Avant → Maintenant

| Axe | Avant | Maintenant |
|---|---|---|
| **Modèle** | Incomplet | Affiné (niveaux de compétence, cas/erreur, etc.) |
| **Visualisation** | Arbre | **Graphe interactif** multi-dispositions |
| **Base de données** | Injoignable de l'extérieur | **Joignable** (Bolt), lue en direct par le visualisateur |
| **Lancement Neo4j** | Scripts PowerShell / Bash | **Docker Compose** (multi-OS, données persistantes) |
| **Lancement du visualisateur** | `npm run dev` local | **Docker dev** avec hot-reload (en plus du local) |
| **Dispositions de graphe** | 1 (force) | **4** : Force, Hiérarchie, Radial, Grappes |
| **Lisibilité** | Labels d'arêtes partout, pas de repère | Arêtes désencombrées, **mini-carte**, **survol = focus** |
| **Robustesse** | Écran blanc possible | **ErrorBoundary** + assainissement des données |
| **Données Neo4j** | Jeu de démo incohérent | **6 graphes métier complets** générés depuis `Data/` |
| **Identité visuelle** | Tailwind générique, dégradé pastel | Design system (Inter, couleurs, ombres) |

---

## 3. Évolution chronologique (par commit)

| Commit | Apport |
|---|---|
| `52eb2ec` | **Commit initial** : visualisateur graphe (JSON uniquement) + données + scripts Neo4j. |
| `3478a6d` | Remplace les scripts PowerShell/Bash par un **setup Docker Compose** pour Neo4j. |
| `ea0cfa4` | Ajoute un **Docker de développement** (hot-reload) pour le visualisateur. |
| `f4a2d79` | **Connecte le visualisateur à Neo4j en lecture directe (Bolt)** — `neo4j-driver`, `neo4jSource.ts`, bouton « Charger depuis Neo4j ». |
| `c2542f5` | Corrige l'**encodage UTF-8** à l'import Neo4j (accents). |
| `0b3e891` | **Modernise le visualisateur et fiabilise les données** (voir détail §4). |

---

## 4. Détail des changements par thème

### 4.1 Infrastructure & déploiement
- **Neo4j sous Docker Compose** (`neo4jDocker/`) : démarrage identique sur Windows/Linux/Mac,
  **données persistantes** (volumes), profil d'import dédié (`--profile import`), plugin APOC,
  paramètres dans `.env`.
- **Visualisateur sous Docker dev** (`jsonVisualisationTool/Dockerfile.dev`,
  `docker-compose.yml`) : hot-reload via bind mount, `node_modules` en volume.

### 4.2 Connexion à la base (BDD joignable)
- `src/utils/neo4jSource.ts` : lecture **directe du graphe complet via Bolt** (`bolt://localhost:7687`),
  conversion des labels Neo4j en groupes de couleurs, configuration surchargeable par `.env`.
- Bouton **« Charger depuis Neo4j »** dans l'app, avec gestion d'erreur de connexion.

### 4.3 Visualisateur — interface (commit `0b3e891`)
- **Refonte visuelle** sans dépendance lourde : police **Inter**, design system Tailwind
  (couleurs `brand`, ombres, animations), header/landing/panneau de détails repensés.
- **Désencombrement des arêtes** : le type de relation passe en **infobulle** (au lieu d'un
  label permanent), arêtes plus fines, claires et semi-transparentes.
- **Survol = focus** : au survol d'un nœud, mise en évidence de son voisinage et estompage
  du reste (pour suivre les liens dans les graphes denses).
- **Mini-carte** (`Minimap.tsx`) : vue d'ensemble sur `<canvas>` avec rectangle de la zone
  visible et clic pour recentrer.
- **Couleur dédiée** pour les nœuds `Competence` (auparavant confondus avec l'Expertise).

### 4.4 Dispositions de graphe (`src/utils/layouts.ts`)
- **Force** (vis-network, Barnes-Hut) et **Hiérarchie** (Sugiyama / vis-network).
- **Radial** : arbre radial robuste (BFS non orienté, racine = nœud le plus connecté,
  secteurs proportionnels au nombre de feuilles), composantes empaquetées en format paysage.
- **Grappes** : group-in-a-box (équivalent manuel d'un layout *compound* type fCoSE) —
  chaque domaine et ses compétences dans sa propre bulle.
- Les deux dispositions « maison » sont **calculées sans nouvelle dépendance** et
  fonctionnent pour les données JSON **et** Neo4j (structure déduite des arêtes).

### 4.5 Robustesse
- `ErrorBoundary.tsx` : évite l'écran blanc en cas d'exception de rendu.
- **Assainissement des données** avant vis-network (ids dupliqués, arêtes orphelines).
- Correction de la **boucle de redimensionnement** (canvas qui grossissait à l'infini →
  graphe blanc) en sortant le conteneur du flux (`absolute inset-0`).
- Physique coupée après stabilisation (évite la saturation CPU), avec **drag réactif**.

### 4.6 Données & cohérence (commit `0b3e891`)
- **Diagnostic** : l'ancien `data.cypher` était un jeu de démo à moitié rempli (nœuds créés
  vides `{}`, propriétés incohérentes `Name`/`nom`, compétences orphelines, nœuds sans nom).
- **`Data/generate_cypher.py`** : convertit **tous** les JSON de `Data/` en un `data.cypher`
  cohérent — labels alignés sur les couleurs du visualisateur, `uid` unique par nœud,
  liens de vocabulaire typés (`ASA`…), étapes/règles rattachées.
- **Résultat** après réimport :

| | Avant | Après |
|---|---|---|
| Nœuds | 43 | **168** |
| Relations | 48 | **192** |
| Nœuds sans nom | 13 | **0** |
| Nœuds isolés | 3 | **0** |
| Filières complètes | 1–2 (stubs) | **6** (Cuisine, Maison Inclusive, Maladies des plantes, Patients âgés, Serre Connectée, Smart City) |

---

## 5. Architecture finale

```
MG74--Outil-transversal-KLM/
├── Data/                       # Sources de connaissances métier
│   ├── *.json                  # 6 graphes métier
│   └── generate_cypher.py      # JSON (tous) → data.cypher cohérent
├── neo4jDocker/                # Base graphe
│   ├── docker-compose.yml      # Neo4j + profil d'import
│   └── data.cypher             # Généré depuis Data/
├── jsonVisualisationTool/      # Visualisateur web
│   └── src/
│       ├── components/         # Header, FileUploader, GraphVisualization,
│       │                       #   NodeDetails, Minimap, ErrorBoundary
│       └── utils/              # graphUtils, neo4jSource, layouts
└── *.puml / *.pdf              # Diagrammes & documentation
```

**Flux de données** : `JSON (Data/)` → `generate_cypher.py` → `data.cypher` →
import Neo4j (Docker) → lecture Bolt → visualisateur (graphe interactif).
Le visualisateur accepte aussi l'**import direct d'un JSON** sans passer par Neo4j.

---

## 6. Limites — résolues et restantes

### Résolues
- ✅ BDD désormais joignable depuis l'extérieur (Bolt).
- ✅ Lancement reproductible (Docker), données persistantes.
- ✅ Visualisation lisible (désencombrement, focus au survol, mini-carte, 4 dispositions).
- ✅ Bug du « graphe blanc » (boucle de redimensionnement) corrigé.
- ✅ Données Neo4j cohérentes (plus de nœuds vides/orphelins).
- ✅ Convergence des conventions : l'ancien convertisseur `jsonToCypher.py` (et son output
  `Cuisine.cypher`) a été **retiré** ; `generate_cypher.py` est l'unique source de référence.

### Restantes / à surveiller
- ⚠️ La dépendance de police (Inter) doit être présente dans l'image Docker du visualisateur
  (rebuild nécessaire après un `docker compose down`/rebuild).
- ⚠️ Sur des graphes très connectés, les dispositions Radial/Grappes restent imparfaites
  (croisements d'arêtes inhérents) — Force/Hiérarchie peuvent être préférables.
