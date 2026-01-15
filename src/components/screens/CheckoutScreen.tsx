import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, Input } from '../common';
import { Customer } from '../../types';

interface CheckoutScreenProps {
  cart: Record<number, number>;
  tickets: any[];
  total: number;
  onBack: () => void;
  onSubmit: (customer: Customer) => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  cart,
  tickets,
  total,
  onBack,
  onSubmit
}) => {
  const [formData, setFormData] = useState<Customer>({
    name: '',
    phone: '',
    email: '',
    cpf: ''
  });

  const handleChange = (field: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const cartItems = Object.entries(cart).filter(([_, qty]) => (qty as number) > 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-black font-bold mb-6 hover:text-yellow-600 transition"
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="md:col-span-2">
            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200">
              <h2 className="text-2xl font-bold mb-6">Dados do Comprador</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nome Completo"
                  value={formData.name}
                  onChange={handleChange('name')}
                  placeholder="Digite seu nome completo"
                  required
                />
                <Input
                  label="CPF"
                  value={formData.cpf}
                  onChange={handleChange('cpf')}
                  placeholder="000.000.000-00"
                  required
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="seu@email.com"
                  required
                />
                <Input
                  label="Telefone"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  placeholder="(00) 00000-0000"
                  required
                />
                <Button type="submit" fullWidth>
                  Continuar para Pagamento
                </Button>
              </form>
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-white p-6 rounded-2xl border-2 border-yellow-400 h-fit sticky top-20">
            <h3 className="font-bold mb-4">Resumo do Pedido</h3>
            <div className="space-y-3 mb-4">
              {cartItems.map(([ticketId, qty]) => {
                const ticket = tickets.find(t => t.id === Number(ticketId));
                if (!ticket) return null;
                const quantity = qty as number;
                return (
                  <div key={ticketId} className="flex justify-between text-sm">
                    <span>{quantity}x {ticket.name}</span>
                    <span className="font-bold">R$ {(ticket.price * quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
