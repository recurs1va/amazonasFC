import React, { useState } from 'react';
import { ArrowLeft, LogOut, ScanLine, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Input } from '../common';
import { Event, ValidatedTicket } from '../../types';

interface ValidationScreenFullProps {
  events: Event[];
  orders: any[];
  onBack: () => void;
  onLogout: () => void;
  onValidate: (code: string, eventId: number) => Promise<{ valid: boolean; message: string; ticket?: any }>;
}

export const ValidationScreenFull: React.FC<ValidationScreenFullProps> = ({
  events,
  orders,
  onBack,
  onLogout,
  onValidate
}) => {
  const [validateEventId, setValidateEventId] = useState<number | null>(null);
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validatedTickets, setValidatedTickets] = useState<ValidatedTicket[]>([]);
  const [validating, setValidating] = useState(false);

  const validateTicket = async () => {
    if (!validateEventId || !ticketCodeInput.trim()) {
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      const result = await onValidate(ticketCodeInput, validateEventId);
      setValidationResult(result);
      
      if (result.valid && result.ticket) {
        // Adicionar à lista de validados
        setValidatedTickets([{
          ticket_code: ticketCodeInput,
          order_id: result.ticket.orderId,
          event_id: validateEventId,
          ticket_id: result.ticket.ticketId,
          customer_name: result.ticket.customerName,
          validated_at: new Date().toISOString()
        }, ...validatedTickets]);
        
        // Limpar input após validação bem-sucedida
        setTimeout(() => {
          setTicketCodeInput('');
          setValidationResult(null);
        }, 3000);
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        message: 'Erro ao validar ingresso'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateTicket();
    }
  };

  // Estatísticas do evento selecionado
  const eventStats = validateEventId ? {
    sold: orders
      .filter(o => o.event_id === validateEventId)
      .reduce((sum, o) => sum + (o.issued_tickets?.length || 0), 0),
    validated: validatedTickets.filter(v => v.event_id === validateEventId).length
  } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black border-b border-yellow-400 h-16 flex items-center px-6 justify-between sticky top-0 z-10">
        <h1 className="font-bold text-yellow-400 flex items-center gap-2">
          <ScanLine size={20} /> Validação de Ingressos
        </h1>
        <div className="flex gap-4">
          <button 
            onClick={onBack} 
            className="text-white font-bold text-sm hover:text-yellow-400 transition flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Voltar ao Admin
          </button>
          <button 
            onClick={onLogout} 
            className="text-red-500 hover:text-red-400"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>
      
      <div className="max-w-2xl mx-auto p-6 mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-yellow-400">
          <h2 className="text-2xl font-bold mb-6 text-center">Validar Ingresso</h2>
          
          {/* Seleção de Evento */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 text-gray-700">
              Selecione o Evento
            </label>
            <select 
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 outline-none"
              value={validateEventId || ''}
              onChange={(e) => {
                setValidateEventId(e.target.value ? parseInt(e.target.value) : null);
                setValidationResult(null);
              }}
            >
              <option value="">Selecione um evento...</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} - {event.date}
                </option>
              ))}
            </select>
          </div>

          {/* Input do Código */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 text-gray-700">
              Código do Ingresso
            </label>
            <div className="flex gap-3">
              <input 
                type="text"
                placeholder="TKT-XXX-XXXX-X"
                className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 outline-none uppercase font-mono"
                value={ticketCodeInput}
                onChange={(e) => {
                  setTicketCodeInput(e.target.value.toUpperCase());
                  setValidationResult(null);
                }}
                onKeyDown={handleKeyDown}
                disabled={!validateEventId}
              />
              <button 
                onClick={validateTicket}
                className="px-8 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-500 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!validateEventId || !ticketCodeInput.trim() || validating}
              >
                <ScanLine size={20} /> {validating ? 'Validando...' : 'Validar'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Digite ou escaneie o código QR do ingresso
            </p>
          </div>

          {/* Resultado da Validação */}
          {validationResult && (
            <div className={`p-6 rounded-xl border-2 ${
              validationResult.valid 
                ? 'bg-green-50 border-green-500' 
                : 'bg-red-50 border-red-500'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {validationResult.valid ? (
                  <CheckCircle2 size={32} className="text-green-600" />
                ) : (
                  <XCircle size={32} className="text-red-600" />
                )}
                <div>
                  <h3 className={`text-xl font-bold ${
                    validationResult.valid ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {validationResult.valid ? 'Ingresso Válido!' : 'Ingresso Inválido'}
                  </h3>
                  <p className={validationResult.valid ? 'text-green-600' : 'text-red-600'}>
                    {validationResult.message}
                  </p>
                </div>
              </div>
              
              {/* Detalhes do ingresso válido */}
              {validationResult.valid && validationResult.ticket && (
                <div className="mt-4 pt-4 border-t border-green-300">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 font-semibold">Titular:</p>
                      <p className="font-bold">{validationResult.ticket.customerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Tipo de Ingresso:</p>
                      <p className="font-bold">{validationResult.ticket.ticket_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Pedido:</p>
                      <p className="font-bold font-mono">{validationResult.ticket.orderId}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Valor:</p>
                      <p className="font-bold text-green-600">
                        R$ {validationResult.ticket.unit_price?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Estatísticas do Evento */}
          {validateEventId && eventStats && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-bold mb-3 text-gray-700">Estatísticas do Evento</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Ingressos Vendidos</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {eventStats.sold}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Ingressos Validados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {eventStats.validated}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Validações Recentes */}
        {validateEventId && validatedTickets.filter(v => v.event_id === validateEventId).length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-6 border-2 border-gray-200">
            <h3 className="font-bold mb-4 text-gray-700">Validações Recentes</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {validatedTickets
                .filter(v => v.event_id === validateEventId)
                .slice(0, 10)
                .map((v, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div>
                      <p className="font-bold text-sm">{v.customer_name}</p>
                      <p className="text-xs text-gray-500 font-mono">{v.ticket_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(v.validated_at || '').toLocaleString('pt-BR')}
                      </p>
                      <CheckCircle2 size={16} className="text-green-600 ml-auto mt-1" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
