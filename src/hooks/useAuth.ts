import { useState, useCallback, useEffect } from 'react';
import { authService, type AuthUser, type SignUpData, type SignInData } from '../services/authService';
import { Customer } from '../types';

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  cpf: string;
  phone: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<Customer | null>(null);

  // Carregar sessão ao montar
  useEffect(() => {
    loadSession();
    
    // Listener para mudanças de autenticação
    const { data: { subscription } } = authService.onAuthStateChange((authUser) => {
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.name || 'Usuário',
          isAdmin: authUser.isAdmin
        });
      } else {
        setUser(null);
        setCustomerData(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadSession = async () => {
    setLoading(true);
    try {
      const authUser = await authService.getSession();
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.name || 'Usuário',
          isAdmin: authUser.isAdmin
        });

        // Carregar dados completos do customer
        if (!authUser.isAdmin) {
          // Garantir que customer existe
          await authService.ensureCustomerExists();
          
          const customer = await authService.getCurrentCustomer();
          setCustomerData(customer);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    const signInData: SignInData = { email, password };
    const result = await authService.signIn(signInData);
    
    if (result.success && result.user) {
      setUser({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name || 'Usuário',
        isAdmin: result.user.isAdmin
      });

      // Carregar dados do customer se não for admin
      if (!result.user.isAdmin) {
        // Garantir que customer existe primeiro
        await authService.ensureCustomerExists();
        
        const customer = await authService.getCurrentCustomer();
        console.log('Customer carregado após login:', customer);
        setCustomerData(customer);
      }
    }
    
    return { success: result.success, message: result.message };
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    // Validação de confirmação de senha
    if (data.password !== data.confirmPassword) {
      return { success: false, message: 'Senhas não coincidem' };
    }

    const signUpData: SignUpData = {
      email: data.email,
      password: data.password,
      name: data.name,
      cpf: data.cpf,
      phone: data.phone
    };

    const result = await authService.signUp(signUpData);
    
    if (result.success && result.user) {
      setUser({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name || 'Usuário',
        isAdmin: result.user.isAdmin
      });

      // Aguardar um pouco para garantir que o registro foi persistido
      await new Promise(resolve => setTimeout(resolve, 500));

      // Carregar dados do customer
      const customer = await authService.getCurrentCustomer();
      console.log('Customer carregado após registro:', customer);
      setCustomerData(customer);
    }
    
    return { success: result.success, message: result.message };
  }, []);

  const logout = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setCustomerData(null);
  }, []);

  const updateCustomer = useCallback(async (updates: Partial<Customer>) => {
    const result = await authService.updateCustomer(updates);
    if (result.success) {
      // Recarregar dados do customer
      const customer = await authService.getCurrentCustomer();
      setCustomerData(customer);
    }
    return result;
  }, []);

  return {
    user,
    customerData, // Dados completos do customer (CPF, telefone, etc)
    loading,
    login,
    register,
    logout,
    updateCustomer,
    refreshCustomer: async () => {
      const customer = await authService.getCurrentCustomer();
      setCustomerData(customer);
    },
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false
  };
};
