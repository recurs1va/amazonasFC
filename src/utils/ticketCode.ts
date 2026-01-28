/**
 * Utilitários para geração e parsing de códigos de ingresso
 */

/**
 * Gera código único de ingresso (DETERMINÍSTICO)
 */
export const generateTicketCode = (
  orderId: string,
  eventId: number,
  ticketId: number,
  itemIndex: number
): string => {
  // USA APENAS DADOS FIXOS - sem timestamp para ser determinístico
  const baseString = `${orderId}-${eventId}-${ticketId}-${itemIndex}`;
  
  // Criar hash simples (em produção, usar biblioteca crypto)
  let hash = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36).toUpperCase();
  return `TKT-${eventId}-${hashStr}-${itemIndex}`;
};

/**
 * Valida e faz parse do código de ingresso
 */
export const parseTicketCode = (
  code: string
): { eventId: number; hash: string; index: number } | null => {
  const match = code.match(/^TKT-(\d+)-([A-Z0-9]+)-(\d+)$/);
  if (!match) return null;
  
  return {
    eventId: parseInt(match[1]),
    hash: match[2],
    index: parseInt(match[3])
  };
};
