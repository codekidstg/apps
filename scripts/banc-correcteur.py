"""
Le correcteur des défis de code, rejoué hors du navigateur.

Même mécanique que src/workers/pyodide.worker.ts : le programme tourne,
input() reçoit des réponses données d'avance et les affiche comme dans le
terminal, puis les tests cachés tournent avec `output` (tout ce qui a été
affiché) et `code` (le texte du programme), dans les mêmes variables que le
programme. Un changement du correcteur se reporte ici.

Lit sur l'entrée une liste JSON de cas {code, tests, reponses} ; écrit la
liste JSON des verdicts {verdict, detail} : « ok », « test raté »,
« plante », « saisie manquante » ou « test plante ».

    echo '[{"code": "print(1)", "tests": "assert output == \"1\"", "reponses": []}]' | python3 scripts/banc-correcteur.py
"""
import builtins
import contextlib
import io
import json
import random
import sys


class BesoinSaisie(Exception):
    pass


def executer(code, tests, reponses):
    variables = {"__name__": "__main__"}
    curseur = [0]

    def saisie(invite=""):
        if curseur[0] < len(reponses):
            valeur = reponses[curseur[0]]
            curseur[0] += 1
            print(f"{invite}{valeur}")
            return valeur
        raise BesoinSaisie(invite)

    ancienne = builtins.input
    builtins.input = saisie
    random.seed(1)
    tampon = io.StringIO()
    try:
        with contextlib.redirect_stdout(tampon):
            exec(compile(code, "<exec>", "exec"), variables)
    except BesoinSaisie as e:
        return "saisie manquante", str(e)
    except Exception as e:
        return "plante", f"{type(e).__name__}: {e}"
    finally:
        builtins.input = ancienne

    # Pyodide rend la sortie ligne par ligne, jointe par des retours à la ligne :
    # pas de retour final.
    variables["output"] = tampon.getvalue().rstrip("\n")
    variables["code"] = code
    try:
        exec(compile(tests, "<tests>", "exec"), variables)
    except AssertionError as e:
        return "test raté", str(e)
    except Exception as e:
        return "test plante", f"{type(e).__name__}: {e}"
    return "ok", variables["output"]


if __name__ == "__main__":
    resultats = []
    for cas in json.load(sys.stdin):
        verdict, detail = executer(cas["code"], cas.get("tests") or "", cas.get("reponses") or [])
        resultats.append({"verdict": verdict, "detail": detail})
    print(json.dumps(resultats, ensure_ascii=False))
