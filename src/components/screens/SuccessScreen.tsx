import React from 'react';
import { Check, Download, Home } from 'lucide-react';
import { Button } from '../common';

interface SuccessScreenProps {
  orderNumber: string;
  total: number;
  customerEmail: string;
  onDownloadTicket: () => void;
  onGoHome: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  orderNumber,
  total,
  customerEmail,
  onDownloadTicket,
  onGoHome
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl border-2 border-green-400 shadow-2xl">
        {/* Ícone de Sucesso */}
        <div className="w-20 h-20 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={48} className="text-white" />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-center mb-2">
          Compra Realizada com Sucesso!
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Seus ingressos estão confirmados
        </p>

        {/* Informações do Pedido */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Número do Pedido</p>
              <p className="font-bold text-lg">{orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Valor Total</p>
              <p className="font-bold text-lg text-green-600">R$ {total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Informações de Envio */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <h3 className="font-bold mb-2 text-sm flex items-center gap-2">
            <Check size={16} className="text-blue-600" />
            E-mail Enviado
          </h3>
          <p className="text-sm text-gray-600">
            Os ingressos foram enviados para <strong>{customerEmail}</strong>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Verifique sua caixa de entrada e spam
          </p>
        </div>

        {/* Instruções */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <h3 className="font-bold mb-2 text-sm">Próximos Passos:</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Guarde seus ingressos com segurança</li>
            <li>Leve um documento com foto no dia do evento</li>
            <li>Chegue com antecedência ao local</li>
            <li>Apresente o QR Code na entrada</li>
          </ul>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <Button onClick={onDownloadTicket} fullWidth>
            <Download size={20} />
            Baixar Ingressos (PDF)
          </Button>
          <button
            onClick={onGoHome}
            className="w-full py-3 rounded-xl border-2 border-gray-300 font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
};
