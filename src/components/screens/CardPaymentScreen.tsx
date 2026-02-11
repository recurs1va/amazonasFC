import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';
import { Button, Input } from '../common';

interface CardPaymentScreenProps {
  total: number;
  onBack: () => void;
  onConfirm: () => void;
}

export const CardPaymentScreen: React.FC<CardPaymentScreenProps> = ({
  total,
  onBack,
  onConfirm
}) => {
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    installments: '1'
  });

  const [processing, setProcessing] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    
    // Formatação do número do cartão
    if (field === 'number') {
      value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      if (value.length > 19) return;
    }
    
    // Formatação da data de validade
    if (field === 'expiry') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      if (value.length > 5) return;
    }
    
    // Formatação do CVV
    if (field === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    
    // Simular processamento do pagamento
    setTimeout(() => {
      setProcessing(false);
      onConfirm();
    }, 2000);
  };

  const installmentValue = total / parseInt(cardData.installments);

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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Pagamento com Cartão</h2>
            <Lock size={24} className="text-green-600" />
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Número do Cartão */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Número do Cartão
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardData.number}
                  onChange={handleChange('number')}
                  placeholder="0000 0000 0000 0000"
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  required
                />
                <CreditCard className="absolute left-3 top-3.5 text-gray-400" size={20} />
              </div>
            </div>

            {/* Nome no Cartão */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nome no Cartão
              </label>
              <input
                type="text"
                value={cardData.name}
                onChange={handleChange('name')}
                placeholder="NOME COMO ESTÁ NO CARTÃO"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 uppercase"
                required
              />
            </div>

            {/* Validade e CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Validade
                </label>
                <input
                  type="text"
                  value={cardData.expiry}
                  onChange={handleChange('expiry')}
                  placeholder="MM/AA"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  value={cardData.cvv}
                  onChange={handleChange('cvv')}
                  placeholder="000"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  required
                />
              </div>
            </div>

            {/* Parcelamento */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Número de Parcelas
              </label>
              <select
                value={cardData.installments}
                onChange={handleChange('installments')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white"
              >
                <option value="1">1x de R$ {total.toFixed(2)} (à vista)</option>
                <option value="2">2x de R$ {(total / 2).toFixed(2)} sem juros</option>
                <option value="3">3x de R$ {(total / 3).toFixed(2)} sem juros</option>
              </select>
            </div>

            {/* Resumo */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Valor Total</span>
                <span className="text-2xl font-bold text-yellow-600">R$ {total.toFixed(2)}</span>
              </div>
              {parseInt(cardData.installments) > 1 && (
                <p className="text-sm text-gray-500 text-right">
                  {cardData.installments}x de R$ {installmentValue.toFixed(2)}
                </p>
              )}
            </div>

            {/* Informação de Segurança */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <Lock size={20} className="text-green-600 mt-0.5" />
              <div className="text-sm text-green-700">
                <p className="font-bold mb-1">Pagamento Seguro</p>
                <p className="text-xs">Seus dados estão protegidos com criptografia SSL</p>
              </div>
            </div>

            {/* Botão de Confirmar */}
            <Button 
              type="submit" 
              fullWidth 
              disabled={processing}
            >
              {processing ? 'Processando Pagamento...' : 'Confirmar Pagamento'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
