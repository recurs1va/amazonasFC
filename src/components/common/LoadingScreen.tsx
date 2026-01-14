import React from 'react';

export const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-white text-center">
      <div className="animate-bounce text-6xl mb-4">🎫</div>
      <h2 className="text-2xl font-bold text-yellow-400">Carregando Sistema...</h2>
    </div>
  </div>
);
