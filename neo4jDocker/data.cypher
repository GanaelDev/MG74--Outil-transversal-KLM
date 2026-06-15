// Constraints (Neo4j 5+ syntax)
CREATE CONSTRAINT organisation_nom_unique IF NOT EXISTS FOR (o:Organisation) REQUIRE o.nom IS UNIQUE;
CREATE CONSTRAINT filiere_nom_unique IF NOT EXISTS FOR (f:Filiere) REQUIRE f.nom IS UNIQUE;
CREATE CONSTRAINT domaine_nom_unique IF NOT EXISTS FOR (d:Domaine) REQUIRE d.nom IS UNIQUE;
CREATE CONSTRAINT competence_nom_unique IF NOT EXISTS FOR (c:Competence) REQUIRE c.nom IS UNIQUE;
CREATE CONSTRAINT regle_name_unique IF NOT EXISTS FOR (r:Regle) REQUIRE r.Name IS UNIQUE;
CREATE CONSTRAINT terme_id_unique IF NOT EXISTS FOR (t:Terme) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT lien_idTermeEnfant_unique IF NOT EXISTS FOR (l:Lien) REQUIRE l.idTermeEnfant IS UNIQUE;

// === Organisation CACIB ===
CREATE (o:Organisation {nom: "CACIB"});
CREATE (f:Filiere {nom: "Finance"});
MATCH (o:Organisation {nom: "CACIB"}), (f:Filiere {nom: "Finance"})
CREATE (o)-[:HAS_FILIERE]->(f);
CREATE (d:Domaine {nom: "Gestion"});
MATCH (f:Filiere {nom: "Finance"}), (d:Domaine {nom: "Gestion"})
CREATE (f)-[:HAS_DOMAINE]->(d);
CREATE (c:Competence {nom: "finance", description: "desc", parametres: "params"});
MATCH (d:Domaine {nom: "Gestion"}), (c:Competence {nom: "finance"})
CREATE (d)-[:HAS_COMPETENCE]->(c);
CREATE (e:Expertise {}), (ex:Experience {type: "type1"}), (p:Procedure {}), (v:Vocabulaire {});
CREATE (r:Regle {Name: "Rule1", Expression: "expr", Type: "type"});
CREATE (et:Etape {numero: 1, description: "desc"});
CREATE (t:Terme {id: 1, nom: "Terme1", description: "desc"});
CREATE (l:Lien {idTermeEnfant: 1, nom: "Lien1", description: "desc"});
MATCH (c:Competence {nom: "finance"}), (e:Expertise {})
CREATE (e)-[:IS_A]->(c);
MATCH (c:Competence {nom: "finance"}), (ex:Experience {type: "type1"})
CREATE (ex)-[:IS_A]->(c);
MATCH (c:Competence {nom: "finance"}), (p:Procedure {})
CREATE (p)-[:IS_A]->(c);
MATCH (c:Competence {nom: "finance"}), (v:Vocabulaire {})
CREATE (v)-[:IS_A]->(c);
MATCH (e:Expertise {}), (r:Regle {Name: "Rule1"})
CREATE (e)-[:HAS_REGLE]->(r);
MATCH (p:Procedure {}), (et:Etape {numero: 1})
CREATE (p)-[:HAS_ETAPE]->(et);
MATCH (v:Vocabulaire {}), (t:Terme {id: 1})
CREATE (v)-[:HAS_TERME]->(t);
MATCH (t:Terme {id: 1}), (l:Lien {idTermeEnfant: 1})
CREATE (t)-[:HAS_LIEN]->(l);

// Filière Informatique - Orchestrade
CREATE (f:Filiere {nom: "Informatique"});
MATCH (o:Organisation {nom: "CACIB"}), (f:Filiere {nom: "Informatique"})
CREATE (o)-[:HAS_FILIERE]->(f);
CREATE (d:Domaine {nom: "Orchestrade"});
MATCH (f:Filiere {nom: "Informatique"}), (d:Domaine {nom: "Orchestrade"})
CREATE (f)-[:HAS_DOMAINE]->(d);
CREATE (c:Competence {nom: ".NET", description: "plateforme de développement...", parametres: "params"});
MATCH (d:Domaine {nom: "Orchestrade"}), (c:Competence {nom: ".NET"})
CREATE (d)-[:HAS_COMPETENCE]->(c);
CREATE (e:Expertise {}), (ex:Experience {type: "type1"}), (p:Procedure {nom: "installer .NET"}), (v:Vocabulaire {});
CREATE (r:Regle {Name: "Respect du typage fort", Expression: "Toutes les variables doivent être déclarées avec un type explicite.", Type: "Bonne pratique"});
CREATE (et1:Etape {numero: 1, description: "Télécharger l’installateur .NET depuis le site officiel de Microsoft."});
CREATE (et2:Etape {numero: 2, description: "Lancer l’installateur et suivre les instructions à l’écran."});
CREATE (et3:Etape {numero: 3, description: "Vérifier l’installation en exécutant la commande dotnet --version dans le terminal."});
CREATE (t1:Terme {id: 2, nom: "Entity Framework", description: "l’ORM (Object-Relational Mapper) officiel de .NET"});
CREATE (t2:Terme {id: 3, nom: "LINQ", description: "Un langage de requêtes intégré directement au C#"});
CREATE (t3:Terme {id: 4, nom: "Async / Await", description: "exécuter des opérations longues sans bloquer l’application."});
CREATE (l:Lien {idTermeEnfant: 2, nom: "Lien2", description: "Lien sur EF"});
MATCH (c:Competence {nom: ".NET"}), (e:Expertise {})
CREATE (e)-[:IS_A]->(c);
MATCH (c:Competence {nom: ".NET"}), (ex:Experience {type: "type1"})
CREATE (ex)-[:IS_A]->(c);
MATCH (c:Competence {nom: ".NET"}), (p:Procedure {nom: "installer .NET"})
CREATE (p)-[:IS_A]->(c);
MATCH (c:Competence {nom: ".NET"}), (v:Vocabulaire {})
CREATE (v)-[:IS_A]->(c);
MATCH (e:Expertise {}), (r:Regle {Name: "Respect du typage fort"})
CREATE (e)-[:HAS_REGLE]->(r);
MATCH (p:Procedure {nom: "installer .NET"}), (et1:Etape {numero: 1}), (et2:Etape {numero: 2}), (et3:Etape {numero: 3})
CREATE (p)-[:HAS_ETAPE]->(et1), (p)-[:HAS_ETAPE]->(et2), (p)-[:HAS_ETAPE]->(et3);
MATCH (v:Vocabulaire {}), (t1:Terme {id: 2}), (t2:Terme {id: 3}), (t3:Terme {id: 4})
CREATE (v)-[:HAS_TERME]->(t1), (v)-[:HAS_TERME]->(t2), (v)-[:HAS_TERME]->(t3);
MATCH (t1:Terme {id: 2}), (l:Lien {idTermeEnfant: 2})
CREATE (t1)-[:HAS_LIEN]->(l);

// Compétences supplémentaires
CREATE (c:Competence {nom: "SQL", description: "base de données", parametres: "params"});
CREATE (c:Competence {nom: "IBM MQ", description: "Messagerie", parametres: "params"});
CREATE (c:Competence {nom: "Octopus", description: "Déploiement", parametres: "params"});

// === Organisation Vetoquinol ===
CREATE (o:Organisation {nom: "Vetoquinol"});
CREATE (f:Filiere {nom: "Production"});
MATCH (o:Organisation {nom: "Vetoquinol"}), (f:Filiere {nom: "Production"})
CREATE (o)-[:HAS_FILIERE]->(f);
CREATE (d:Domaine {nom: "Chimie"});
MATCH (f:Filiere {nom: "Production"}), (d:Domaine {nom: "Chimie"})
CREATE (f)-[:HAS_DOMAINE]->(d);
CREATE (c:Competence {nom: "Formulation", description: "Mélange de composants", parametres: "standard"});
MATCH (d:Domaine {nom: "Chimie"}), (c:Competence {nom: "Formulation"})
CREATE (d)-[:HAS_COMPETENCE]->(c);

CREATE (f:Filiere {nom: "Qualité"});
MATCH (o:Organisation {nom: "Vetoquinol"}), (f:Filiere {nom: "Qualité"})
CREATE (o)-[:HAS_FILIERE]->(f);
CREATE (d:Domaine {nom: "Contrôle"});
MATCH (f:Filiere {nom: "Qualité"}), (d:Domaine {nom: "Contrôle"})
CREATE (f)-[:HAS_DOMAINE]->(d);
CREATE (c:Competence {nom: "Audit", description: "Vérification des normes", parametres: "ISO"});
MATCH (d:Domaine {nom: "Contrôle"}), (c:Competence {nom: "Audit"})
CREATE (d)-[:HAS_COMPETENCE]->(c);

// === Organisation GE Vernova ===
CREATE (o:Organisation {nom: "GE Vernova"});
CREATE (f:Filiere {nom: "Énergie"});
MATCH (o:Organisation {nom: "GE Vernova"}), (f:Filiere {nom: "Énergie"})
CREATE (o)-[:HAS_FILIERE]->(f);
CREATE (d:Domaine {nom: "Hydraulique"});
MATCH (f:Filiere {nom: "Énergie"}), (d:Domaine {nom: "Hydraulique"})
CREATE (f)-[:HAS_DOMAINE]->(d);
CREATE (c:Competence {nom: "Turbines", description: "Machines tournantes", parametres: "mécaniques"});
MATCH (d:Domaine {nom: "Hydraulique"}), (c:Competence {nom: "Turbines"})
CREATE (d)-[:HAS_COMPETENCE]->(c);

CREATE (f:Filiere {nom: "Informatique"});
MATCH (o:Organisation {nom: "GE Vernova"}), (f:Filiere {nom: "Informatique"})
CREATE (o)-[:HAS_FILIERE]->(f);
CREATE (d:Domaine {nom: "Supervision"});
MATCH (f:Filiere {nom: "Informatique"}), (d:Domaine {nom: "Supervision"})
CREATE (f)-[:HAS_DOMAINE]->(d);
CREATE (c:Competence {nom: "SCADA", description: "Système de contrôle", parametres: "temps réel"});
MATCH (d:Domaine {nom: "Supervision"}), (c:Competence {nom: "SCADA"})
CREATE (d)-[:HAS_COMPETENCE]->(c);
