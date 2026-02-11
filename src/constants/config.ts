/**
 * Credenciais padrão do sistema
 */
export const DEFAULT_ADMIN = {
  email: 'admin@admin.com',
  password: 'admin',
  name: 'Administrador'
} as const;

/**
 * Métodos de pagamento disponíveis
 */
export const PAYMENT_METHODS = {
  PIX: 'pix',
  CARD: 'card',
  CASH: 'cash'
} as const;

/**
 * Telas do aplicativo
 */
export const SCREENS = {
  LOGIN: 'login',
  EVENTS_LIST: 'events-list',
  ADMIN: 'admin',
  EVENT_DETAIL: 'event-detail',
  CHECKOUT: 'checkout',
  CONFIRM: 'confirm',
  VALIDATE: 'validate'
} as const;
