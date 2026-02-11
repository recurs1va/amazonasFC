import { useState } from 'react';

export const useCart = () => {
  const [cart, setCart] = useState<Record<number, number>>({});

  const addToCart = (ticketId: number, quantity: number = 1) => {
    setCart(prev => ({
      ...prev,
      [ticketId]: (prev[ticketId] || 0) + quantity
    }));
  };

  const removeFromCart = (ticketId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[ticketId];
      return newCart;
    });
  };

  const updateQuantity = (ticketId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(ticketId);
    } else {
      setCart(prev => ({
        ...prev,
        [ticketId]: quantity
      }));
    }
  };

  const clearCart = () => {
    setCart({});
  };

  const getTotal = (tickets: Array<{ id: number; price: number }>) => {
    return Object.entries(cart).reduce((total, [id, quantity]) => {
      const ticket = tickets.find(t => t.id === parseInt(id));
      return total + (ticket ? ticket.price * quantity : 0);
    }, 0);
  };

  const getItemCount = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount
  };
};
