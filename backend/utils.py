import io
from typing import Optional
from PyPDF2 import PdfReader

def _normalizar(texto: str) -> str:
    return " ".join((texto or "").replace("\r", "\n").split())

def _ler_txt(arquivo) -> str:
    conteudo = arquivo.read()
    try:
        if isinstance(conteudo, bytes):
            try:
                return _normalizar(conteudo.decode("utf-8", errors="ignore"))
            except Exception:
                return _normalizar(conteudo.decode("latin-1", errors="ignore"))
        else:
            return _normalizar(str(conteudo))
    finally:
        try:
            arquivo.seek(0)
        except Exception:
            try:
                arquivo.stream.seek(0)
            except Exception:
                pass

def _ler_pdf(arquivo) -> str:
    try:
        bruto = arquivo.read()
        reader = PdfReader(io.BytesIO(bruto))
        paginas_txt = []
        for pagina in reader.pages:
            try:
                txt = pagina.extract_text() or ""
            except Exception:
                txt = ""
            paginas_txt.append(txt)
        return _normalizar("\n".join(paginas_txt))
    finally:
        try:
            arquivo.seek(0)
        except Exception:
            try:
                arquivo.stream.seek(0)
            except Exception:
                pass

def extrair_texto_arquivo(file_storage: Optional[object]) -> str:
    """
    Recebe um arquivo enviado via formulário (Flask) e retorna o texto.
    Suporta .txt e .pdf. Faz fallback para leitura como texto.
    """
    if file_storage is None:
        return ""

    nome = (getattr(file_storage, "filename", "") or "").lower()
    mimetype = (getattr(file_storage, "mimetype", "") or
                getattr(file_storage, "content_type", "") or "").lower()

    try:
        if nome.endswith(".txt"):
            return _ler_txt(file_storage)
        if nome.endswith(".pdf"):
            return _ler_pdf(file_storage)

        if "pdf" in mimetype:
            return _ler_pdf(file_storage)
        if mimetype.startswith("text/") or "plain" in mimetype:
            return _ler_txt(file_storage)

        return _ler_txt(file_storage)

    finally:
        try:
            file_storage.stream.seek(0)
        except Exception:
            try:
                file_storage.seek(0)
            except Exception:
                pass
