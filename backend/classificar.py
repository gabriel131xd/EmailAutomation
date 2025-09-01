# backend/classificar.py
import os
import json
import time
import requests
from typing import Dict, Tuple

HF_MODEL = os.getenv("HF_MODEL", "joeddav/xlm-roberta-large-xnli")
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")

CATEGORIES = ["Agradecimento", "Reclamação", "Orçamento", "Dúvida", "Improdutivo"]

INFERENCE_LABELS = {
    "Agradecimento": "Agradecimento (obrigado, agradeço, valeu, satisfação)",
    "Reclamação": "Reclamação (problema, defeito, não funciona, erro, atraso, troca, garantia)",
    "Orçamento": "Orçamento (preço, valor, cotação, proposta, orçamento para X unidades)",
    "Dúvida": "Dúvida (como faço, poderia informar, esclarecimento, ajuda, instruções)",
    "Improdutivo": "Improdutivo (spam, irrelevante, sem pedido, assunto não relacionado)",
}

SUB_TO_MAIN = {
    "Agradecimento": "Improdutivo",
    "Improdutivo": "Improdutivo",
    "Reclamação": "Produtivo",
    "Orçamento": "Produtivo",
    "Dúvida": "Produtivo",
}

DEFAULT_THRESHOLD = 0.45


def _norm(texto: str) -> str:
    return (texto or "").lower().strip()


def _hit(texto: str, termos) -> bool:
    t = _norm(texto)
    return any(term in t for term in termos)


def _heuristica_categoria(texto: str, sub_prevista: str) -> Tuple[str, float, bool]:
    """
    Ajuste determinístico por palavras-chave.
    Sempre que detectar um padrão forte, força a subcategoria correspondente.
    Retorna: (subcategoria, confianca_minima, via_fallback_bool)
    """
    t = _norm(texto)

    termos_agr = ["obrigado", "agradeço", "agradeco", "valeu", "satisfeito", "satisfeita"]
    termos_rec = [
        "reclamação", "reclamacao", "problema", "defeito", "erro",
        "não funciona", "nao funciona", "quebrado", "troca",
        "garantia", "atraso", "atrasado", "danificado", "refund",
        "reembolso"
    ]
    termos_orc = ["orçamento", "orcamento", "preço", "preco", "valor", "cotação", "cotacao", "proposta", "cotacao"]
    termos_duv = ["dúvida", "duvida", "como faço", "como faco", "poderia informar", "esclarecimento", "ajuda", "instruções", "instrucoes"]

    if _hit(t, termos_rec):
        return "Reclamação", 0.80, True
    if _hit(t, termos_orc):
        return "Orçamento", 0.75, True
    if _hit(t, termos_duv):
        return "Dúvida", 0.70, True
    if _hit(t, termos_agr):
        return "Agradecimento", 0.80, True

    if sub_prevista in CATEGORIES:
        return sub_prevista, 0.0, False

    return "Improdutivo", 0.60, True


def regrasFallback(texto: str) -> Dict:
    sub, conf, via = _heuristica_categoria(texto, "Improdutivo")
    return {"categoria": sub, "confianca": conf, "principal": SUB_TO_MAIN[sub], "via_fallback": via}


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
            "hypothesis_template": "Este e-mail é sobre {}.",
        },
    }


def _inferir_hf(texto: str, timeout_seg: float) -> Dict:
    resp = requests.post(
        HF_API_URL,
        headers=cabecalho_hf(),
        data=json.dumps(corpo_hf(texto)),
        timeout=timeout_seg,
    )
    return resp.json()


def _mapear_label_inferencia(rotulo_inferencia: str) -> str:
    for sub, frase in INFERENCE_LABELS.items():
        if frase == rotulo_inferencia:
            return sub
    return "Improdutivo"


def classificar_email(
    texto: str,
    threshold: float = DEFAULT_THRESHOLD,
    timeout_seg: float = 12.0,
    tentativas: int = 1,
) -> Dict:
    if not texto or not texto.strip():
        sub = "Improdutivo"
        return {"categoria": sub, "principal": SUB_TO_MAIN[sub], "confianca": 0.0, "via_fallback": True}

    if not HF_API_TOKEN:
        return regrasFallback(texto)

    ultimo_erro = None

    for tentativa in range(tentativas + 1):
        try:
            dados = _inferir_hf(texto, timeout_seg)
        except Exception as e:
            ultimo_erro = str(e)
            dados = {"error": ultimo_erro}

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
        sub_prevista = _mapear_label_inferencia(rotulo_inferencia)
        confianca = float(scores[0])

        if confianca < threshold:
            sub_prevista = "Improdutivo"

        sub_ajustada, conf_min, via_fallback = _heuristica_categoria(texto, sub_prevista)
        conf_final = max(confianca, conf_min)

        return {
            "categoria": sub_ajustada,
            "principal": SUB_TO_MAIN[sub_ajustada],
            "confianca": max(0.0, min(1.0, conf_final)),
            "via_fallback": via_fallback,
        }

    return regrasFallback(texto)
