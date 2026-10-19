export function unavailableEngineAction() {
  return { ok: false, error: "Aucun fournisseur de conteneurs réel n’est connecté. Aucune opération exécutée." };
}