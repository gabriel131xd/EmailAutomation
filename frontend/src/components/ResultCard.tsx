import { useState } from 'react';
import { Copy, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ApiResponse } from '../lib/api';

interface ResultCardProps {
  result: ApiResponse;
  onReset?: () => void;
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
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
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-xl font-semibold">Resultado da Análise</h2>
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
            <div
              className="progress-fill"
              style={{ width: `${result.classificacao.confianca * 100}%` }}
            />
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
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Resposta Sugerida</label>
          <button
            onClick={handleCopy}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
              copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>

        {/* CAIXA DE RESPOSTA com contraste forçado */}
        <textarea
          value={result.resposta_sugerida || ''}
          readOnly
          className="textarea-custom response-box min-h-[120px]"
        />
      </div>

      <div className="border-t pt-4">
        <button
          onClick={() => setShowEmailText(!showEmailText)}
          className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">Ver e-mail analisado</span>
          {showEmailText ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {showEmailText && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {result.email_texto.length > 1000
                ? result.email_texto.substring(0, 1000) + '...'
                : result.email_texto}
            </p>
          </div>
        )}
      </div>

      {onReset && (
        <button onClick={onReset} className="button-secondary mt-4">
          Limpar
        </button>
      )}
    </div>
  );
}
