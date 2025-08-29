# backend/responder.py  (OpenAI • IA pura • lazy init do cliente)
import os
from typing import Optional
from openai import OpenAI

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

def _get_client() -> Optional[OpenAI]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)

def _montar_prompt(categoria: str, texto: str) -> str:
    return (
        "Você é um atendente brasileiro. Responda o e-mail abaixo em PT-BR de forma clara, educada e objetiva.\n"
        "Regras:\n"
        "- Máx. 5 frases curtas (1–2 parágrafos).\n"
        "- Não invente informações; se faltar algo, peça somente o essencial.\n"
        "- Não use assinatura pessoal.\n\n"
        f"Categoria: {categoria or 'Geral'}\n"
        "E-mail do cliente:\n"
        f"\"\"\"{(texto or '').strip()}\"\"\"\n\n"
        "Resposta:"
    )

def _gerar(prompt: str, timeout: float = 20.0) -> Optional[str]:
    client = _get_client()
    if not client:
        return None  # sem chave -> IA-pura retorna vazio depois

    api = client.with_options(timeout=timeout)
    try:
        resp = api.chat.completions.create(
            model=OPENAI_MODEL,
            temperature=0.2,
            max_tokens=220,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Você é um atendente de suporte brasileiro. "
                        "Responda curto, cordial e objetivo, sem inventar dados."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        )
        out = (resp.choices[0].message.content or "").strip()
        return out or None
    except Exception:
        return None

def sugerir_resposta(categoria: str, texto: str = "") -> str:
    t = (texto or "").strip()
    if not t:
        return ""  # IA-pura: nada de fallback de conteúdo

    prompt = _montar_prompt(categoria, t)

    # retry leve p/ estabilidade
    for _ in range(2):
        out = _gerar(prompt)
        if out:
            return out
    return ""  # falhou a IA -> string vazia
