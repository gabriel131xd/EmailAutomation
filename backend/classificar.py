import os
import json
import time
import requests
from typing import Dict

HF_MODEL = os.getenv("HF_MODEL", "joeddav/xlm-roberta-large-xnli")
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")

CATEGORIES = ["Agradecimento", "Reclamação", "Orçamento", "Dúvida", "Improdutivo"]

INFERENCE_LABELS = {
    "Agradecimento": "Agradecimento (obrigado, agradeço, valeu, satisfação)",
    "Reclamação": "Reclamação (problema, defeito, não funciona, erro, atraso, troca, garantia)",
    "Orçamento": "Orçamento (preço, valor, cotação, proposta, orçamento para X unidades)",
    "Dúvida": "Dúvida (como faço, poderia informar, esclarecimento, ajuda, instruções)",
    "Improdutivo": "Improdutivo (spam, irrelevante, sem pedido, assunto não relacionado)"
}

SUB_TO_MAIN = {
    "Agradecimento": "Improdutivo",
    "Improdutivo": "Improdutivo",
    "Reclamação": "Produtivo",
    "Orçamento": "Produtivo",
    "Dúvida": "Produtivo",
}

DEFAULT_THRESHOLD = 0.50


def regrasFallback(texto: str) -> Dict:
    t = (texto or "").lower()

    if any(p in t for p in ["obrigado", "agradeço", "agradeco", "valeu"]):
        sub = "Agradecimento"
        return {"categoria": sub, "confianca": 0.80, "principal": SUB_TO_MAIN[sub], "via_fallback": True}

    if any(p in t for p in ["reclamação", "reclamacao", "problema", "erro", "não funciona", "nao funciona", "defeito"]):
        sub = "Reclamação"
        return {"categoria": sub, "confianca": 0.75, "principal": SUB_TO_MAIN[sub], "via_fallback": True}

    if any(p in t for p in ["orçamento", "orcamento", "preço", "preco", "valor", "cotação", "cotacao", "proposta"]):
        sub = "Orçamento"
        return {"categoria": sub, "confianca": 0.70, "principal": SUB_TO_MAIN[sub], "via_fallback": True}

    sub = "Improdutivo"
    return {"categoria": sub, "confianca": 0.60, "principal": SUB_TO_MAIN[sub], "via_fallback": True}


def cabecalho_hf() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": "application/json",
    }


def corpo_hf(texto: str) -> Dict:
    return {
        "inputs": texto,
        "parameters": {
            "candidate_labels": list(INFERENCE_LABELS.values()),
            "multi_label": False,
            "hypothesis_template": "Este e-mail é sobre {}."
        }
    }


def classificar_email(texto: str,
                      threshold: float = DEFAULT_THRESHOLD,
                      timeout_seg: float = 12.0,
                      tentativas: int = 1) -> Dict:
    if not texto or not texto.strip():
        sub = "Improdutivo"
        return {"categoria": sub, "principal": SUB_TO_MAIN[sub], "confianca": 0.0, "via_fallback": True}

    if not HF_API_TOKEN:
        return regrasFallback(texto)

    ultimoErro = None

    for tentativa in range(tentativas + 1):
        try:
            resp = requests.post(
                HF_API_URL,
                headers=cabecalho_hf(),
                data=json.dumps(corpo_hf(texto)),
                timeout=timeout_seg,
            )
            dados = resp.json()
        except Exception as e:
            ultimoErro = str(e)
            dados = {"error": ultimoErro}

        if isinstance(dados, dict) and "error" in dados:
            if tentativa < tentativas:
                time.sleep(1.0 + 0.5 * tentativa)
                continue
            return regrasFallback(texto)

        labels = dados.get("labels")
        scores = dados.get("scores")

        if not labels or not scores or len(labels) != len(scores):
            return regrasFallback(texto)

        rotulo_inferencia = labels[0]
        sub = next((k for k, v in INFERENCE_LABELS.items() if v == rotulo_inferencia), "Improdutivo")
        confianca = float(scores[0])

        if confianca < threshold:
            sub = "Improdutivo"

        return {
            "categoria": sub,
            "principal": SUB_TO_MAIN[sub],
            "confianca": max(0.0, min(1.0, confianca))
        }

    return regrasFallback(texto)
