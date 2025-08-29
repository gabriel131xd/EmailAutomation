import io
from typing import Optional
from PyPDF2 import PdfReader

def _normalizar(texto: str) -> str:
    # comprime espaços e normaliza quebras de linha
    return " ".join((texto or "").replace("\r", "\n").split())

def _ler_txt(arquivo) -> str:
    """
    Lê bytes e tenta decodificar como UTF-8; se falhar, tenta Latin-1.
    """
    conteudo = arquivo.read()  # bytes ou str
    try:
        if isinstance(conteudo, bytes):
            try:
                return _normalizar(conteudo.decode("utf-8", errors="ignore"))
            except Exception:
                return _normalizar(conteudo.decode("latin-1", errors="ignore"))
        else:
            return _normalizar(str(conteudo))
    finally:
        # volta o ponteiro para permitir releitura em outro lugar
        try:
            arquivo.seek(0)
        except Exception:
            try:
                arquivo.stream.seek(0)
            except Exception:
                pass

def _ler_pdf(arquivo) -> str:
    """
    Extrai texto de PDFs; se uma página não tiver texto, adiciona vazio.
    Aceita tanto FileStorage quanto file-like.
    """
    try:
        # lê bytes e cria um buffer independente
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
        # reposiciona o ponteiro
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

    # nome e mimetype (ambos podem ajudar)
    nome = (getattr(file_storage, "filename", "") or "").lower()
    mimetype = (getattr(file_storage, "mimetype", "") or
                getattr(file_storage, "content_type", "") or "").lower()

    try:
        # pelo nome do arquivo
        if nome.endswith(".txt"):
            return _ler_txt(file_storage)
        if nome.endswith(".pdf"):
            return _ler_pdf(file_storage)

        # se não tiver extensão confiável, tenta pelo mimetype
        if "pdf" in mimetype:
            return _ler_pdf(file_storage)
        if mimetype.startswith("text/") or "plain" in mimetype:
            return _ler_txt(file_storage)

        # fallback: tenta como texto mesmo
        return _ler_txt(file_storage)

    finally:
        # garante reposicionamento
        try:
            file_storage.stream.seek(0)
        except Exception:
            try:
                file_storage.seek(0)
            except Exception:
                pass
