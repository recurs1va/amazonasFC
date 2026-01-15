import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Camera } from 'lucide-react';
import { Button, Input } from '../common';

interface ValidationScreenProps {
  onBack: () => void;
  onValidate: (code: string) => Promise<{ valid: boolean; message: string; data?: any }>;
}

export const ValidationScreen: React.FC<ValidationScreenProps> = ({
  onBack,
  onValidate
}) => {
  const [ticketCode, setTicketCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const handleValidate = async () => {
    if (!ticketCode.trim()) return;

    setValidating(true);
    setResult(null);

    try {
      const validationResult = await onValidate(ticketCode);
      setResult(validationResult);
      
      // Limpar após 3 segundos se for válido
      if (validationResult.valid) {
        setTimeout(() => {
          setTicketCode('');
          setResult(null);
        }, 3000);
      }
    } catch (error) {
      setResult({
        valid: false,
        message: 'Erro ao validar ingresso'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-white hover:text-yellow-400 transition"
          >
            <ArrowLeft size={20} /> Voltar
          </button>
          <h1 className="text-xl font-bold text-yellow-400">Validação de Ingressos</h1>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6">
        {/* Scanner Area */}
        <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 mb-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera size={40} className="text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Escanear Ingresso</h2>
            <p className="text-gray-500">Digite ou escaneie o código do ingresso</p>
          </div>

          <div className="space-y-4">
            <Input
              label="Código do Ingresso"
              value={ticketCode}
              onChange={setTicketCode}
              onKeyPress={handleKeyPress}
              placeholder="Digite o código aqui"
              autoFocus
            />
            <Button 
              onClick={handleValidate} 
              fullWidth 
              disabled={!ticketCode.trim() || validating}
            >
              {validating ? 'Validando...' : 'Validar Ingresso'}
            </Button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`p-6 rounded-2xl border-2 ${
              result.valid
                ? 'bg-green-50 border-green-400'
                : 'bg-red-50 border-red-400'
            }`}
          >
            <div className="flex items-center gap-4">
              {result.valid ? (
                <CheckCircle size={48} className="text-green-600 flex-shrink-0" />
              ) : (
                <XCircle size={48} className="text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-1 ${
                  result.valid ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.valid ? 'Ingresso Válido!' : 'Ingresso Inválido'}
                </h3>
                <p className={result.valid ? 'text-green-700' : 'text-red-700'}>
                  {result.message}
                </p>
                
                {result.valid && result.data && (
                  <div className="mt-4 bg-white rounded-lg p-4 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-gray-500 text-xs">Cliente</p>
                        <p className="font-bold">{result.data.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Evento</p>
                        <p className="font-bold">{result.data.event_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Tipo</p>
                        <p className="font-bold">{result.data.ticket_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Pedido</p>
                        <p className="font-bold font-mono">{result.data.order_id?.slice(0, 8)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
          <h3 className="font-bold mb-2 text-sm">Instruções:</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Peça ao cliente para apresentar o ingresso (QR Code ou código)</li>
            <li>Escaneie o QR Code ou digite o código manualmente</li>
            <li>Aguarde a validação do sistema</li>
            <li>Libere a entrada se o ingresso for válido</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
