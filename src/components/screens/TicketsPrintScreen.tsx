import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Home, ArrowRight } from 'lucide-react';
import { Button } from '../common';
import { generateTicketCode } from '../../utils/ticketCode';
import { Event, Ticket } from '../../types';

interface CartItem {
  ticketId: number;
  quantity: number;
}

interface TicketsPrintScreenProps {
  orderId: string;
  eventId: number;
  event: Event | undefined;
  cartItems: CartItem[];
  tickets: Ticket[];
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  total: number;
  onGoHome: () => void;
}

interface GeneratedTicket {
  code: string;
  ticketId: number;
  ticketName: string;
  price: number;
  itemIndex: number;
}

export const TicketsPrintScreen: React.FC<TicketsPrintScreenProps> = ({
  orderId,
  eventId,
  event,
  cartItems,
  tickets,
  customerName,
  customerEmail,
  customerCpf,
  total,
  onGoHome
}) => {
  const [generatedTickets, setGeneratedTickets] = useState<GeneratedTicket[]>([]);

  useEffect(() => {
    // Gerar tickets com códigos únicos
    const newTickets: GeneratedTicket[] = [];
    let itemIndex = 1;

    cartItems.forEach(({ ticketId, quantity }) => {
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      for (let i = 0; i < quantity; i++) {
        const code = generateTicketCode(orderId, eventId, ticketId, itemIndex);
        newTickets.push({
          code,
          ticketId: ticket.id,
          ticketName: ticket.name,
          price: ticket.price,
          itemIndex
        });
        itemIndex++;
      }
    });

    setGeneratedTickets(newTickets);
  }, [orderId, eventId, cartItems, tickets]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Em produção, usar biblioteca como jsPDF para gerar PDF
    alert('Funcionalidade de download PDF será implementada em breve!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho - Não imprimir */}
      <div className="no-print bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seus Ingressos</h1>
              <p className="text-sm text-gray-500">
                {generatedTickets.length} {generatedTickets.length === 1 ? 'ingresso' : 'ingressos'} • Pedido #{orderId}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleDownloadPDF} variant="outline">
                <Download size={18} />
                Baixar PDF
              </Button>
              <Button onClick={handlePrint}>
                <Printer size={18} />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Pedido - Aparece uma vez */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">DADOS DO PEDIDO</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Pedido:</strong> {orderId}</p>
                <p><strong>Total:</strong> R$ {total.toFixed(2)}</p>
                <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">COMPRADOR</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Nome:</strong> {customerName}</p>
                <p><strong>CPF:</strong> {customerCpf}</p>
                <p><strong>Email:</strong> {customerEmail}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ingressos Individuais */}
        <div className="space-y-6">
          {generatedTickets.map((ticket, index) => (
            <div 
              key={ticket.code} 
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden page-break"
            >
              {/* Topo do Ticket */}
              <div className="bg-gradient-to-r from-yellow-400 to-green-400 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{event?.name || 'Evento'}</h2>
                    <p className="text-sm opacity-90">{event?.location || ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Ingresso {index + 1} de {generatedTickets.length}</p>
                    <p className="text-xs opacity-75">{new Date(event?.date || '').toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              {/* Corpo do Ticket */}
              <div className="p-6">
                <div className="flex gap-6">
                  {/* QR Code */}
                  <div className="flex-shrink-0">
                    <div className="bg-white p-3 border-2 border-gray-300 rounded-lg">
                      <QRCodeSVG 
                        value={ticket.code} 
                        size={150}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-xs text-center mt-2 text-gray-500 font-mono">
                      {ticket.code}
                    </p>
                  </div>

                  {/* Informações do Ticket */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{ticket.ticketName}</h3>
                      <p className="text-lg text-green-600 font-bold">R$ {ticket.price.toFixed(2)}</p>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <ArrowRight size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-700">Nome do Titular</p>
                          <p className="text-gray-600">{customerName}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <ArrowRight size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-700">CPF do Titular</p>
                          <p className="text-gray-600">{customerCpf}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <ArrowRight size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-700">Data e Horário</p>
                          <p className="text-gray-600">
                            {new Date(event?.date || '').toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <ArrowRight size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-700">Local</p>
                          <p className="text-gray-600">{event?.location || ''}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instruções */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-xs text-gray-700 mb-2">INSTRUÇÕES IMPORTANTES:</h4>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                    <li>Apresente este QR Code na entrada do evento</li>
                    <li>Leve um documento com foto para validação</li>
                    <li>Chegue com antecedência ao local</li>
                    <li>Este ingresso é pessoal e intransferível</li>
                    <li>Guarde este ingresso até o final do evento</li>
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botão para voltar - Não imprimir */}
        <div className="no-print mt-8 flex justify-center">
          <Button onClick={onGoHome} size="large">
            <Home size={20} />
            Voltar para Eventos
          </Button>
        </div>
      </div>

      {/* Estilos de Impressão */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .page-break {
            page-break-after: always;
            page-break-inside: avoid;
          }
          
          .no-print {
            display: none !important;
          }
          
          .min-h-screen {
            min-height: auto;
          }
          
          .bg-gray-50 {
            background: white;
          }
        }
      `}</style>
    </div>
  );
};
