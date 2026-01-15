import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { Button } from '../common';

interface PixScreenProps {
  total: number;
  pixCode: string;
  onBack: () => void;
  onConfirm: () => void;
}

export const PixScreen: React.FC<PixScreenProps> = ({
  total,
  pixCode,
  onBack,
  onConfirm
}) => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutos

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-black font-bold mb-6 hover:text-yellow-600 transition"
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="bg-white p-8 rounded-2xl border-2 border-gray-200">
          <h2 className="text-2xl font-bold mb-2 text-center">Pagamento via PIX</h2>
          <p className="text-gray-500 mb-8 text-center">
            Escaneie o QR Code ou copie o código PIX
          </p>

          {/* QR Code Placeholder */}
          <div className="bg-gray-100 aspect-square max-w-xs mx-auto rounded-xl mb-6 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-sm">QR Code PIX</p>
              <p className="text-xs mt-2">Escaneie com seu banco</p>
            </div>
          </div>

          {/* Valor */}
          <div className="text-center mb-6">
            <p className="text-gray-500 text-sm">Valor a pagar</p>
            <p className="text-3xl font-bold text-green-600">R$ {total.toFixed(2)}</p>
          </div>

          {/* Código PIX */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <p className="text-xs text-gray-500 mb-2">Código PIX Copia e Cola</p>
            <div className="flex gap-2">
              <code className="flex-1 bg-white p-3 rounded border text-xs overflow-auto">
                {pixCode}
              </code>
              <button
                onClick={handleCopy}
                className="bg-yellow-400 text-black px-4 rounded hover:bg-yellow-500 transition"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          {/* Timer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-gray-600">Código expira em</p>
            <p className="text-2xl font-bold text-yellow-600">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-bold mb-2 text-sm">Como pagar:</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Abra o app do seu banco</li>
              <li>Escolha pagar via PIX</li>
              <li>Escaneie o QR Code ou cole o código</li>
              <li>Confirme o pagamento</li>
            </ol>
          </div>

          <Button onClick={onConfirm} fullWidth>
            Já fiz o pagamento
          </Button>
        </div>
      </div>
    </div>
  );
};
