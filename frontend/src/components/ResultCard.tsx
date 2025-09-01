import { useState } from 'react';
import { Copy, CheckCircle, ChevronDown, ChevronUp, FileDown, FileJson, RefreshCw } from 'lucide-react';
import { ApiResponse } from '../lib/api';

interface ResultCardProps {
  result: ApiResponse;
  onReset?: () => void;
  onNewAnalysis?: () => void;
}

export default function ResultCard({ result, onReset, onNewAnalysis }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [showEmailText, setShowEmailText] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.resposta_sugerida || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([result.resposta_sugerida || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'resposta_sugerida.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'analise_email.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Produtivo: 'badge-green',
      Improdutivo: 'badge-red',
      Agradecimento: 'badge-gray',
      Reclamação: 'badge-yellow',
      Orçamento: 'badge-blue',
      Dúvida: 'badge-purple',
    };
    return colors[category] || 'badge-gray';
  };

  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <div className="card fade-in">
      <div className="flex items-start justify-between mb-6 gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Resultado da Análise</h2>
        <span className={`badge ${getCategoryColor(result.classificacao.categoria)}`}>
          {result.classificacao.categoria}
        </span>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Confiança</span>
            <span className="text-sm text-gray-600">{formatPercent(result.classificacao.confianca)}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${result.classificacao.confianca * 100}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Principal</span>
          <span className={`badge ${getCategoryColor(result.classificacao.principal)}`}>
            {result.classificacao.principal}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm font-medium text-gray-700">Resposta Sugerida</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className={`px-3 py-1 rounded-md text-sm transition-transform shadow-sm inline-flex items-center gap-1 ${
                copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              aria-label="Copiar resposta sugerida"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>

            <button
              onClick={downloadTxt}
              className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 inline-flex items-center gap-1 shadow-sm"
              aria-label="Baixar resposta como .txt"
            >
              <FileDown className="w-4 h-4" />
              .txt
            </button>

            <button
              onClick={downloadJson}
              className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 inline-flex items-center gap-1 shadow-sm"
              aria-label="Baixar análise como .json"
            >
              <FileJson className="w-4 h-4" />
              .json
            </button>

            {onNewAnalysis && (
              <button
                onClick={onNewAnalysis}
                className="px-3 py-1 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1 shadow-md transition-transform"
                aria-label="Nova análise"
              >
                <RefreshCw className="w-4 h-4" />
                Nova análise
              </button>
            )}
          </div>
        </div>

        <textarea
          value={result.resposta_sugerida || ''}
          readOnly
          className="textarea-custom response-box min-h-[120px]"
          aria-label="Texto da resposta sugerida"
        />
      </div>

      <div className="border-t pt-4">
        <button
          onClick={() => setShowEmailText(!showEmailText)}
          className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          aria-expanded={showEmailText}
          aria-controls="email-analisado"
        >
          <span className="text-sm font-medium text-gray-700">
            {showEmailText ? 'Ocultar e-mail analisado' : 'Ver e-mail analisado'}
          </span>
          {showEmailText ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {showEmailText && (
          <div id="email-analisado" className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {result.email_texto?.length > 1200
                ? result.email_texto.substring(0, 1200) + '...'
                : result.email_texto}
            </p>
          </div>
        )}
      </div>

      {onReset && (
        <button onClick={onReset} className="button-secondary mt-4" aria-label="Limpar resultado">
          Limpar
        </button>
      )}
    </div>
  );
}
