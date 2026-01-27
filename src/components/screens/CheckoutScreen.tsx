import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Button, Input } from '../common';
import { Customer } from '../../types';
import { orderService } from '../../services';

interface CheckoutScreenProps {
  cart: Record<number, number>;
  tickets: any[];
  total: number;
  onBack: () => void;
  onSubmit: (customer: Customer) => void;
  initialCustomerData?: Customer | null; // Dados do usuário logado
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  cart,
  tickets,
  total,
  onBack,
  onSubmit,
  initialCustomerData
}) => {
  const [formData, setFormData] = useState<Customer>({
    name: '',
    phone: '',
    email: '',
    cpf: ''
  });
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-preencher com dados do usuário logado
  useEffect(() => {
    if (initialCustomerData) {
      setFormData({
        name: initialCustomerData.name || '',
        phone: initialCustomerData.phone || '',
        email: initialCustomerData.email || '',
        cpf: formatCpf(initialCustomerData.cpf || '')
      });
      if (initialCustomerData.cpf) {
        setIsExistingCustomer(true);
      }
    }
  }, [initialCustomerData]);

  // Formata CPF enquanto digita
  const formatCpf = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  // Busca cliente pelo CPF quando tiver 11 dígitos
  const searchCustomerByCpf = useCallback(async (cpf: string) => {
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length === 11) {
      setIsSearching(true);
      try {
        const existingCustomer = await orderService.findCustomerByCpf(cleanCpf);
        
        if (existingCustomer) {
          setFormData({
            cpf: formatCpf(existingCustomer.cpf),
            name: existingCustomer.name || '',
            email: existingCustomer.email || '',
            phone: existingCustomer.phone || ''
          });
          setIsExistingCustomer(true);
        } else {
          setIsExistingCustomer(false);
        }
      } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        setIsExistingCustomer(false);
      } finally {
        setIsSearching(false);
      }
    } else {
      setIsExistingCustomer(false);
    }
  }, []);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
    
    // Busca cliente quando CPF estiver completo
    searchCustomerByCpf(e.target.value);
  };

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
                {/* CPF como primeiro campo */}
                <div className="relative">
                  <Input
                    label="CPF"
                    value={formData.cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-9">
                      <Loader2 size={20} className="animate-spin text-yellow-500" />
                    </div>
                  )}
                  {isExistingCustomer && !isSearching && (
                    <div className="flex items-center gap-2 mt-1 text-green-600 text-sm">
                      <CheckCircle size={16} />
                      <span>Cliente encontrado! Dados carregados.</span>
                    </div>
                  )}
                </div>
                <Input
                  label="Nome Completo"
                  value={formData.name}
                  onChange={handleChange('name')}
                  placeholder="Digite seu nome completo"
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
