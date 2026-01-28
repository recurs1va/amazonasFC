import React from 'react';
import { ArrowLeft, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '../common';

interface PaymentScreenProps {
  total: number;
  onBack: () => void;
  onSelectMethod: (method: 'pix' | 'card') => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  total,
  onBack,
  onSelectMethod
}) => {
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
          <h2 className="text-2xl font-bold mb-2">Forma de Pagamento</h2>
          <p className="text-gray-500 mb-8">Escolha como deseja pagar</p>

          <div className="space-y-4">
            {/* PIX */}
            <button
              onClick={() => onSelectMethod('pix')}
              className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-yellow-400 hover:shadow-lg transition text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Smartphone size={24} className="text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">PIX</h3>
                  <p className="text-sm text-gray-500">Pagamento instantâneo</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl">R$ {total.toFixed(2)}</p>
                  <p className="text-xs text-green-600">Aprovação imediata</p>
                </div>
              </div>
            </button>

            {/* Cartão de Crédito */}
            <button
              onClick={() => onSelectMethod('card')}
              className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-yellow-400 hover:shadow-lg transition text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Cartão de Crédito</h3>
                  <p className="text-sm text-gray-500">Pagamento seguro</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl">R$ {total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Em até 3x sem juros</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
