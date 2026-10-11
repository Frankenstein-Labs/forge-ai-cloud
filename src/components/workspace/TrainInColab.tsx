// Bouton « Entraîner dans Colab » : génère un notebook .ipynb de fine-tuning (LoRA)
// pré-rempli avec la clé Aetheris de l'utilisateur, le télécharge et ouvre Colab.
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const md = (s: string) => ({ cell_type: "markdown", metadata: {}, source: s });
const code = (s: string) => ({
  cell_type: "code",
  metadata: {},
  execution_count: null,
  outputs: [],
  source: s,
});

export function buildNotebook(o: {
  apiKey: string;
  origin: string;
  baseModel: string;
  dataset: string;
  outputRepo: string;
}) {
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      colab: { provenance: [], gpuType: "T4" },
      accelerator: "GPU",
      kernelspec: { name: "python3", display_name: "Python 3" },
    },
    cells: [
      md(
        `# 🚀 Entraînement Aetheris\nBase : \`${o.baseModel}\` · Données : \`${o.dataset}\` → \`${o.outputRepo}\`\n\n**Avant de lancer** : Exécution → Modifier le type d'exécution → **GPU T4**. Puis Exécution → Tout exécuter.`,
      ),
      code(
        `AETHERIS_API_KEY = "${o.apiKey}"\nAETHERIS_BASE_URL = "${o.origin}"\nBASE_MODEL = "${o.baseModel}"\nDATASET = "${o.dataset}"\nOUTPUT_REPO = "${o.outputRepo}"`,
      ),
      code(
        "!pip -q install -U transformers datasets peft trl accelerate huggingface_hub",
      ),
      md(
        "## Connexion Hugging Face\nVotre jeton `hf_…` (droit **Write**) est demandé ici — il n'est jamais écrit dans le fichier.",
      ),
      code(
        "from getpass import getpass\nfrom huggingface_hub import login\ntry:\n    from google.colab import userdata\n    HF_TOKEN = userdata.get('HF_TOKEN')\nexcept Exception:\n    HF_TOKEN = None\nif not HF_TOKEN:\n    HF_TOKEN = getpass('Jeton Hugging Face (hf_...) : ')\nlogin(token=HF_TOKEN)",
      ),
      md("## Entraînement LoRA"),
      code(
        [
          "from datasets import load_dataset",
          "from peft import LoraConfig",
          "from trl import SFTTrainer, SFTConfig",
          "",
          "ds = load_dataset(DATASET, split='train')",
          "ds = ds.select(range(min(2000, len(ds))))",
          "",
          "trainer = SFTTrainer(",
          "    model=BASE_MODEL,",
          "    train_dataset=ds,",
          "    peft_config=LoraConfig(r=16, lora_alpha=32, target_modules='all-linear', task_type='CAUSAL_LM'),",
          "    args=SFTConfig(output_dir='out', num_train_epochs=1, per_device_train_batch_size=2,",
          "                   gradient_accumulation_steps=4, learning_rate=2e-4, logging_steps=10,",
          "                   fp16=True, push_to_hub=True, hub_model_id=OUTPUT_REPO, hub_token=HF_TOKEN),",
          ")",
          "trainer.train()",
          "trainer.push_to_hub()",
          "print('✅ Modèle publié : https://huggingface.co/' + OUTPUT_REPO)",
        ].join("\n"),
      ),
      md("## Tester via Aetheris"),
      code(
        [
          "import requests",
          "r = requests.post(f'{AETHERIS_BASE_URL}/api/v1/chat/completions',",
          "    headers={'Authorization': f'Bearer {AETHERIS_API_KEY}'},",
          "    json={'model': 'hf/' + OUTPUT_REPO, 'messages': [{'role': 'user', 'content': 'Bonjour !'}]},",
          "    timeout=120)",
          "print(r.status_code, r.json())",
        ].join("\n"),
      ),
    ],
  };
}

export function TrainInColab() {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [baseModel, setBaseModel] = useState("Qwen/Qwen2.5-0.5B-Instruct");
  const [dataset, setDataset] = useState("trl-lib/Capybara");
  const [outputRepo, setOutputRepo] = useState("");

  function generate() {
    if (!apiKey.startsWith("sk-aeth-")) return toast.error("Collez une clé sk-aeth-… (page Clés API)");
    if (!/^[\w.-]+\/[\w.-]+$/.test(outputRepo))
      return toast.error("Dépôt de sortie au format compte/nom-du-modele");
    const nb = buildNotebook({
      apiKey: apiKey.trim(),
      origin: window.location.origin,
      baseModel: baseModel.trim(),
      dataset: dataset.trim(),
      outputRepo: outputRepo.trim(),
    });
    const blob = new Blob([JSON.stringify(nb, null, 1)], { type: "application/x-ipynb+json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `aetheris-train-${outputRepo.split("/")[1]}.ipynb`;
    a.click();
    URL.revokeObjectURL(a.href);
    window.open("https://colab.research.google.com/#create=true", "_blank", "noopener");
    toast.success("Notebook téléchargé — dans Colab : Fichier → Importer le notebook.");
    setOpen(false);
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <GraduationCap className="me-2 size-4" /> Entraîner dans Colab
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entraîner un modèle dans Google Colab</DialogTitle>
            <DialogDescription>
              Génère un notebook prêt à l'emploi. Le résultat est publié sur votre compte Hugging
              Face puis utilisable ici via <code>hf/compte/nom</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-key">Clé Aetheris</Label>
              <Input id="c-key" type="password" placeholder="sk-aeth-…" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-base">Modèle de base (Hugging Face)</Label>
              <Input id="c-base" value={baseModel} onChange={(e) => setBaseModel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-ds">Jeu de données (Hugging Face)</Label>
              <Input id="c-ds" value={dataset} onChange={(e) => setDataset(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-out">Dépôt de sortie</Label>
              <Input id="c-out" placeholder="moncompte/mon-modele" value={outputRepo} onChange={(e) => setOutputRepo(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={generate}>Générer et ouvrir Colab</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
