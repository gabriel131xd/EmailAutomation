import { useEffect, useRef, useState } from 'react';
import { Mail, Send, AlertCircle, Loader2, RefreshCw, Eraser } from 'lucide-react';
import UploadZone from './components/UploadZone';
import ResultCard from './components/ResultCard';
import { analyzeText, analyzeFile, ApiResponse, ApiError } from './lib/api';

function App() {
  const [emailText, setEmailText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [apiUp, setApiUp] = useState(false);
  const [checkedOnce, setCheckedOnce] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE as string;

  const pingHealth = async (tries = 3) => {
    const backoff = (i: number) => new Promise((r) => setTimeout(r, 500 * (i + 1)));
    for (let i = 0; i < tries; i++) {
      try {
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(`${API_BASE}/`, { signal: ctrl.signal });
        clearTimeout(id);
        if (res.ok) return true;
      } catch {}
      await backoff(i);
    }
    return false;
  };

  useEffect(() => {
    (async () => {
      const ok = await pingHealth();
      setApiUp(ok);
      setCheckedOnce(true);
    })();
  }, [API_BASE]);

  const recheck = async () => {
    const ok = await pingHealth();
    setApiUp(ok);
    setCheckedOnce(true);
    showToast(ok ? 'success' : 'error', ok ? 'API online ✅' : 'API ainda hibernada');
  };

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const handleAnalyzeText = async () => {
    if (!emailText.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const response = await analyzeText(emailText);
      setResult(response);
      setApiUp(true);
      setCheckedOnce(true);
      showToast('success', 'Análise concluída');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao analisar o texto');
      showToast('error', 'Falha na análise');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const response = await analyzeFile(file);
      setResult(response);
      if ((response as any)?.email_texto) setEmailText((response as any).email_texto);
      setApiUp(true);
      setCheckedOnce(true);
      showToast('success', 'Arquivo analisado');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao analisar o arquivo');
      showToast('error', 'Falha na análise do arquivo');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setEmailText('');
    setResult(null);
    setError(null);
    showToast('success', 'Limpo');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key.toLowerCase() === 'enter') {
        e.preventDefault();
        if (!isAnalyzing) void handleAnalyzeText();
      }
      if (cmd && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (!isAnalyzing) handleReset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAnalyzing, emailText]);

  return (
    <div className="min-h-screen py-8">
      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.msg}
        </div>
      )}

      <div className="container-responsive">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <Mail className="w-8 h-8 text-blue-600" aria-hidden />
            </div>
            <h1 className="text-3xl font-bold text-white">EmailAutomation</h1>
          </div>
          <p className="text-blue-100 text-base">Classificação & Resposta Automática de E-mails</p>
        </div>

        {checkedOnce && !apiUp && !isAnalyzing && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" aria-hidden />
            <div>
              <p className="text-yellow-800 text-sm">
                <strong>API fora do ar.</strong> Em hosts gratuitos a primeira chamada pode demorar alguns segundos para “acordar”.
              </p>
              <button
                onClick={recheck}
                className="mt-2 inline-flex items-center gap-2 text-yellow-700 hover:text-yellow-800 text-sm underline"
                aria-label="Tentar novamente"
              >
                <RefreshCw className="w-4 h-4" aria-hidden />
                <span>Tentar novamente</span>
              </button>
            </div>
          </div>
        )}

        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReset}
              disabled={isAnalyzing || (!emailText && !result && !error)}
              className="button-secondary inline-flex items-center gap-2"
              aria-label="Limpar"
            >
              <Eraser className="w-4 h-4" /> Limpar
            </button>

            <div className="ml-auto flex gap-2">
              <button onClick={recheck} className="button-secondary inline-flex items-center gap-2" aria-label="Checar API">
                <RefreshCw className="w-4 h-4" /> API
              </button>
              <button
                onClick={handleAnalyzeText}
                disabled={!emailText.trim() || isAnalyzing}
                className="button-primary inline-flex items-center gap-2"
                aria-label="Analisar"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 spinner" /> Analisando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Analisar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Análise de E-mail</h2>

              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email-textarea">
                Cole o texto do e-mail
              </label>
              <textarea
                id="email-textarea"
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                placeholder="Cole aqui o texto do e-mail que deseja analisar..."
                className="textarea-custom min-h-[200px]"
                disabled={isAnalyzing}
                aria-label="Área de texto do e-mail"
              />
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ou envie um arquivo (.txt / .pdf)</h3>
              <UploadZone onFileSelect={handleFileUpload} disabled={isAnalyzing} loading={isAnalyzing} />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 mt-0.5" aria-hidden />
                  <div>
                    <p className="font-medium">Falha na análise</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {result ? (
              <ResultCard
                result={result}
                onReset={handleReset}
                onNewAnalysis={() => {
                  setResult(null);
                  showToast('success', 'Pronto para nova análise');
                }}
              />
            ) : (
              <div className="card">
                <p className="text-gray-600 text-sm">
                  O resultado da análise aparecerá aqui assim que você enviar um texto ou arquivo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
