const API_BASE = import.meta.env.VITE_API_BASE as string;

export interface ApiResponse {
  email_texto: string;
  classificacao: {
    categoria: string;
    confianca: number;
    principal: string;
  };
  resposta_sugerida: string;
}

export interface ApiError {
  message: string;
  status: number;
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 30000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(input, { ...init, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function checkHealth(): Promise<boolean> {
  const tries = 3;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/`, {}, 8000);
      if (res.ok) return true;
    } catch {
    }
    await new Promise(r => setTimeout(r, 500 * (i + 1)));
  }
  return false;
}

export async function analyzeText(texto: string): Promise<ApiResponse> {
  const response = await fetchWithTimeout(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  });

  if (!response.ok) {
    const error: ApiError = {
      message: await getErrorMessage(response),
      status: response.status,
    };
    throw error;
  }
  return response.json();
}

export async function analyzeFile(file: File): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithTimeout(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = {
      message: await getErrorMessage(response),
      status: response.status,
    };
    throw error;
  }
  return response.json();
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const errorData = await response.json();
    return (
      (errorData as any).message ||
      (errorData as any).error ||
      `Erro ${response.status}`
    );
  } catch {
    switch (response.status) {
      case 0:
        return 'Falha de rede (CORS/timeout). Tente novamente.';
      case 400:
        return 'Nenhum texto fornecido';
      case 404:
        return 'Endpoint não encontrado';
      case 500:
        return 'Erro interno do servidor';
      default:
        return `Erro ${response.status}`;
    }
  }
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['.txt', '.pdf'];

  if (file.size > maxSize) {
    return { valid: false, error: 'Arquivo muito grande. Máximo: 10MB' };
  }
  const extension = '.' + (file.name.split('.').pop() || '').toLowerCase();
  if (!allowedTypes.includes(extension)) {
    return { valid: false, error: 'Formato não suportado. Use .txt ou .pdf' };
  }
  return { valid: true };
}
