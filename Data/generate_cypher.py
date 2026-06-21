"""
Génère neo4jDocker/data.cypher à partir de TOUS les fichiers JSON métier de Data/.

Produit un graphe cohérent et complet (chaque nœud a un nom/description), avec des
labels alignés sur le visualisateur (Filiere/Domaine/Vocabulaire/Procedure/Etape/
Expertise/Regle/Experience) pour que les couleurs et regroupements soient corrects.

Chaque nœud reçoit un identifiant unique `uid` (les noms se répètent entre filières),
utilisé pour créer les relations sans ambiguïté.

Usage :
    cd Data && python3 generate_cypher.py
"""

import json
import re
import glob
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "neo4jDocker", "data.cypher")

# Ordre de chargement déterministe.
JSON_FILES = sorted(glob.glob(os.path.join(os.path.dirname(__file__), "*.json")))

lines = []
uid = 0


def s(value):
    """Littéral de chaîne Cypher (échappement via json.dumps : \\n, \\\", \\\\)."""
    return json.dumps("" if value is None else str(value), ensure_ascii=False)


def rel_type(raw):
    """Type de relation Cypher valide à partir d'un libellé de Lien (ex. 'a un sous-aspect')."""
    t = re.sub(r"[^A-Za-z0-9_]", "_", (raw or "").strip().upper()).strip("_")
    return t or "LIEN"


def node(label, props):
    """Crée un nœud avec un uid unique ; renvoie cet uid."""
    global uid
    uid += 1
    fields = ", ".join(f"{k}: {v}" for k, v in props.items())
    lines.append(f"CREATE (:{label} {{uid: {uid}, {fields}}});")
    return uid


def rel(a_label, a_uid, rtype, b_label, b_uid):
    lines.append(
        f"MATCH (a:{a_label} {{uid: {a_uid}}}), (b:{b_label} {{uid: {b_uid}}}) "
        f"CREATE (a)-[:{rtype}]->(b);"
    )


for path in JSON_FILES:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    filiere = data.get("filliereMetier")
    if not filiere:
        continue

    lines.append(f"// === Filière : {filiere.get('nom')} ({os.path.basename(path)}) ===")
    fil_uid = node("Filiere", {"nom": s(filiere.get("nom"))})

    for dom in filiere.get("domaineMetier", []):
        dom_uid = node("Domaine", {"nom": s(dom.get("nom"))})
        rel("Filiere", fil_uid, "HAS_DOMAINE", "Domaine", dom_uid)

        # --- Vocabulaire (+ liens entre termes) ---
        vocab_uid_by_id = {}
        liens = []  # (from_local_id, to_local_id, type)
        for v in dom.get("Vocabulaire", []):
            v_uid = node("Vocabulaire", {
                "nom": s(v.get("nom")),
                "description": s(v.get("description")),
                "ref": s(v.get("id")),
            })
            rel("Domaine", dom_uid, "HAS_VOCABULAIRE", "Vocabulaire", v_uid)
            vocab_uid_by_id[v.get("id")] = v_uid
            for lien in v.get("Lien", []) or []:
                liens.append((v.get("id"), lien.get("terme"), lien.get("type")))
        # liens créés après coup (les deux extrémités doivent exister)
        for src, dst, ltype in liens:
            if src in vocab_uid_by_id and dst in vocab_uid_by_id:
                rel("Vocabulaire", vocab_uid_by_id[src], rel_type(ltype),
                    "Vocabulaire", vocab_uid_by_id[dst])

        # --- Procédural (+ étapes) ---
        for p in dom.get("Procedural", []):
            p_uid = node("Procedure", {"nom": s(p.get("nom")), "description": s(p.get("description"))})
            rel("Domaine", dom_uid, "HAS_PROCEDURE", "Procedure", p_uid)
            for et in p.get("etape", []) or []:
                numero = et.get("numero")
                e_uid = node("Etape", {
                    "nom": s(f"Étape {numero}" if numero not in (None, "") else "Étape"),
                    "numero": s(numero),
                    "description": s(et.get("description")),
                })
                rel("Procedure", p_uid, "HAS_ETAPE", "Etape", e_uid)

        # --- Expertise (+ règles) ---
        for exp in dom.get("ExpertiseMetier", []):
            x_uid = node("Expertise", {"nom": s(exp.get("nom")), "description": s(exp.get("description"))})
            rel("Domaine", dom_uid, "HAS_EXPERTISE", "Expertise", x_uid)
            for r in exp.get("regles", []) or []:
                r_uid = node("Regle", {
                    "nom": s(r.get("nom")),
                    "type": s(r.get("type")),
                    "expression": s(r.get("expression")),
                })
                rel("Expertise", x_uid, "HAS_REGLE", "Regle", r_uid)

        # --- Expérimental ---
        for ex in dom.get("Experimental", []):
            ex_uid = node("Experience", {
                "nom": s(ex.get("nom")),
                "description": s(ex.get("description")),
                "type": s(ex.get("type")),
            })
            rel("Domaine", dom_uid, "HAS_EXPERIMENTAL", "Experience", ex_uid)


with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"{uid} nœuds générés depuis {len(JSON_FILES)} fichiers → {os.path.relpath(OUT)}")
