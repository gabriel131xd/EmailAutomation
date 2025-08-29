import { useState, useEffect } from 'react';
import { Mail, Send, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import UploadZone from './components/UploadZone';
import ResultCard from './components/ResultCard';
import { analyzeText, analyzeFile, checkHealth, ApiResponse, ApiError } from './lib/api';

function App() {
  const [emailText, setEmailText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    const healthy = await checkHealth();
    setApiHealthy(healthy);
  };

  const handleAnalyzeText = async () => {
    if (!emailText.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const response = await analyzeText(emailText);
      setResult(response);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao analisar o texto');
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
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao analisar o arquivo');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setEmailText('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-white">EmailAutomation</h1>
          </div>
          <p className="text-blue-100 text-lg">Classificação & Resposta Automática de E-mails</p>
        </div>

        {/* API Status */}
        {apiHealthy === false && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-800 text-sm">
                <strong>API fora do ar.</strong> Em hosts gratuitos a primeira chamada pode demorar alguns segundos para “acordar”.
              </p>
              <button
                onClick={checkApiHealth}
                className="mt-2 inline-flex items-center space-x-2 text-yellow-700 hover:text-yellow-800 text-sm underline"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tentar novamente</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Entrada */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Análise de E-mail</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cole o texto do e-mail
                  </label>
                  <textarea
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    placeholder="Cole aqui o texto do e-mail que deseja analisar..."
                    className="textarea-custom min-h-[200px]"
                    disabled={isAnalyzing}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleAnalyzeText}
                    disabled={!emailText.trim() || isAnalyzing}
                    className="button-primary flex items-center justify-center space-x-2 flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 spinner" />
                        <span>Analisando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Analisar texto</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    disabled={isAnalyzing || (!emailText && !result && !error)}
                    className="button-secondary"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            </div>

            {/* Upload */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ou envie um arquivo (.txt / .pdf)</h3>
              <UploadZone onFileSelect={handleFileUpload} disabled={isAnalyzing} />
            </div>

            {/* Erro */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Falha na análise</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resultado */}
          <div className="space-y-6">
            {result ? (
              <ResultCard result={result} onReset={handleReset} />
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
