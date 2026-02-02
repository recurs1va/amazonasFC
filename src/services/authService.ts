import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Customer } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  cpf: string;
  phone: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin';

/**
 * Serviço de autenticação usando Supabase Auth
 */
class AuthService {
  /**
   * Registra novo usuário e cria registro de cliente
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    // Validações
    if (!data.email || !data.password || !data.name || !data.cpf || !data.phone) {
      return { success: false, message: 'Preencha todos os campos obrigatórios' };
    }

    if (data.password.length < 6) {
      return { success: false, message: 'Senha deve ter no mínimo 6 caracteres' };
    }

    if (data.email === ADMIN_EMAIL) {
      return { success: false, message: 'Este e-mail está reservado' };
    }

    // Se não tiver Supabase configurado, usar localStorage (fallback)
    if (!isSupabaseConfigured || !supabase) {
      return this.signUpLocalStorage(data);
    }

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          return { success: false, message: 'Este e-mail já está registrado' };
        }
        // Tratamento específico para rate limiting
        if (authError.message.includes('rate limit') || authError.status === 429) {
          return { 
            success: false, 
            message: 'Muitas tentativas de cadastro. Por favor, aguarde alguns minutos e tente novamente.' 
          };
        }
        return { success: false, message: authError.message };
      }

      if (!authData.user) {
        return { success: false, message: 'Erro ao criar usuário' };
      }

      // 2. Criar registro na tabela customers vinculado ao auth.users
      // Usando função RPC para contornar problemas de RLS
      console.log('Tentando criar customer via RPC...');
      
      const { data: insertedCustomer, error: customerError } = await supabase
        .rpc('create_customer_for_user', {
          p_auth_user_id: authData.user.id,
          p_name: data.name,
          p_email: data.email,
          p_cpf: data.cpf.replace(/\D/g, ''),
          p_phone: data.phone.replace(/\D/g, '')
        })
        .single();

      console.log('Resposta RPC:', { insertedCustomer, customerError });

      if (customerError) {
        console.error('Erro ao criar customer via RPC:', customerError);
        
        // Se a função não existir, tentar método tradicional (fallback)
        if (customerError.message?.includes('function') || customerError.code === '42883') {
          console.log('Função create_customer_for_user não encontrada, tentando insert direto...');
          
          const customerData: any = {
            auth_user_id: authData.user.id,
            name: data.name,
            email: data.email,
            cpf: data.cpf.replace(/\D/g, ''),
            phone: data.phone.replace(/\D/g, '')
          };

          const { data: directInsert, error: directError } = await supabase
            .from('customers')
            .insert(customerData)
            .select()
            .single();

          console.log('Resposta INSERT direto:', { directInsert, directError });

          if (directError) {
            console.error('Erro ao criar customer (método direto):', directError);
            return {
              success: false,
              message: 'Erro ao criar registro de cliente. Verifique as políticas RLS no Supabase.'
            };
          }

          console.log('Customer criado com sucesso (método direto):', directInsert);
        } else {
          return {
            success: false,
            message: 'Erro ao criar registro de cliente: ' + customerError.message
          };
        }
      } else {
        console.log('Customer criado com sucesso via RPC:', insertedCustomer);
      }

      return {
        success: true,
        message: 'Cadastro realizado com sucesso!',
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          name: data.name,
          isAdmin: false
        }
      };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao realizar cadastro'
      };
    }
  }

  /**
   * Faz login do usuário
   */
  async signIn(data: SignInData): Promise<AuthResponse> {
    // Admin hardcoded
    if (data.email === ADMIN_EMAIL && data.password === ADMIN_PASSWORD) {
      return {
        success: true,
        message: '',
        user: {
          id: 'admin',
          email: ADMIN_EMAIL,
          name: 'Administrador',
          isAdmin: true
        }
      };
    }

    // Se não tiver Supabase configurado, usar localStorage (fallback)
    if (!isSupabaseConfigured || !supabase) {
      return this.signInLocalStorage(data);
    }

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        return { success: false, message: 'E-mail ou senha incorretos' };
      }

      if (!authData.user) {
        return { success: false, message: 'Erro ao fazer login' };
      }

      // Buscar dados do customer
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();

      return {
        success: true,
        message: '',
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          name: customerData?.name || authData.user.user_metadata?.name || 'Usuário',
          isAdmin: false
        }
      };
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        success: false,
        message: 'E-mail ou senha incorretos'
      };
    }
  }

  /**
   * Faz logout do usuário
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    // Limpar qualquer estado local
    localStorage.removeItem('amazonasFC_currentUser');
  }

  /**
   * Obtém a sessão atual
   */
  async getSession(): Promise<AuthUser | null> {
    console.log('[authService] getSession - isSupabaseConfigured:', isSupabaseConfigured);
    
    if (!isSupabaseConfigured || !supabase) {
      console.log('[authService] Usando fallback localStorage');
      // Fallback: verificar localStorage
      const stored = localStorage.getItem('amazonasFC_currentUser');
      return stored ? JSON.parse(stored) : null;
    }

    try {
      console.log('[authService] Buscando sessão do Supabase...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[authService] Erro ao buscar sessão:', error);
        return null;
      }
      
      if (!session?.user) {
        console.log('[authService] Nenhuma sessão ativa');
        return null;
      }

      console.log('[authService] Sessão encontrada para:', session.user.email);

      // Se for admin
      if (session.user.email === ADMIN_EMAIL) {
        return {
          id: 'admin',
          email: ADMIN_EMAIL,
          name: 'Administrador',
          isAdmin: true
        };
      }

      // Buscar dados do customer
      console.log('[authService] Buscando customer para user_id:', session.user.id);
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();

      if (customerError && customerError.code !== 'PGRST116') {
        // PGRST116 = No rows found (é esperado em alguns casos)
        console.error('[authService] Erro ao buscar customer:', customerError);
      }

      return {
        id: session.user.id,
        email: session.user.email!,
        name: customerData?.name || session.user.user_metadata?.name || 'Usuário',
        isAdmin: false
      };
    } catch (error) {
      console.error('[authService] Erro ao obter sessão:', error);
      return null;
    }
  }

  /**
   * Busca dados completos do customer do usuário logado
   */
  async getCurrentCustomer(): Promise<Customer | null> {
    if (!isSupabaseConfigured || !supabase) {
      // Fallback: buscar do localStorage
      const storedUser = localStorage.getItem('amazonasFC_currentUser');
      if (!storedUser) return null;
      
      const user = JSON.parse(storedUser);
      const users = this.getLocalStorageUsers();
      const userData = users[user.email];
      
      if (!userData) return null;
      
      console.log('getCurrentCustomer (localStorage):', userData);
      
      return {
        id: undefined,
        name: userData.name,
        email: user.email,
        cpf: userData.cpf || '',
        phone: userData.phone || ''
      };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('getCurrentCustomer: Sem sessão');
        return null;
      }

      console.log('Buscando customer para auth_user_id:', session.user.id);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar customer:', error);
        return null;
      }

      console.log('getCurrentCustomer (Supabase):', data);
      return data;
    } catch (error) {
      console.error('Erro ao obter customer:', error);
      return null;
    }
  }

  /**
   * Atualiza dados do customer do usuário logado
   */
  async updateCustomer(updates: Partial<Customer>): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase não configurado' };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return { success: false, message: 'Usuário não autenticado' };
      }

      // Limpar CPF e telefone antes de salvar
      const cleanUpdates: any = { ...updates };
      if (cleanUpdates.cpf) {
        cleanUpdates.cpf = cleanUpdates.cpf.replace(/\D/g, '');
      }
      if (cleanUpdates.phone) {
        cleanUpdates.phone = cleanUpdates.phone.replace(/\D/g, '');
      }

      const { error } = await supabase
        .from('customers')
        .update(cleanUpdates)
        .eq('auth_user_id', session.user.id);

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Dados atualizados com sucesso' };
    } catch (error) {
      console.error('Erro ao atualizar customer:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao atualizar dados'
      };
    }
  }

  /**
   * Garante que o customer existe para o usuário logado (cria se não existir)
   * Útil para casos onde o usuário foi criado mas o customer não
   */
  async ensureCustomerExists(): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true, message: 'Modo offline' };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return { success: false, message: 'Usuário não autenticado' };
      }

      // Verificar se customer já existe
      const { data: existing } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();

      if (existing) {
        return { success: true, message: 'Customer já existe' };
      }

      // Criar customer se não existir
      const { error } = await supabase
        .from('customers')
        .insert({
          auth_user_id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || 'Usuário',
          cpf: '',
          phone: ''
        });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Customer criado com sucesso' };
    } catch (error) {
      console.error('Erro ao garantir customer:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao criar customer'
      };
    }
  }

  /**
   * Listener para mudanças de autenticação
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!isSupabaseConfigured || !supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getSession();
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  // ========== FALLBACK: localStorage ==========

  private signUpLocalStorage(data: SignUpData): AuthResponse {
    const users = this.getLocalStorageUsers();
    
    if (users[data.email]) {
      return { success: false, message: 'Este e-mail já está registrado' };
    }

    users[data.email] = {
      password: data.password,
      name: data.name,
      cpf: data.cpf,
      phone: data.phone
    };
    
    localStorage.setItem('amazonasFC_users', JSON.stringify(users));

    const user: AuthUser = {
      id: data.email,
      email: data.email,
      name: data.name,
      isAdmin: false
    };

    localStorage.setItem('amazonasFC_currentUser', JSON.stringify(user));

    return {
      success: true,
      message: 'Cadastro realizado com sucesso!',
      user
    };
  }

  private signInLocalStorage(data: SignInData): AuthResponse {
    const users = this.getLocalStorageUsers();
    
    if (!users[data.email] || users[data.email].password !== data.password) {
      return { success: false, message: 'E-mail ou senha incorretos' };
    }

    const user: AuthUser = {
      id: data.email,
      email: data.email,
      name: users[data.email].name,
      isAdmin: false
    };

    localStorage.setItem('amazonasFC_currentUser', JSON.stringify(user));

    return {
      success: true,
      message: '',
      user
    };
  }

  private getLocalStorageUsers(): Record<string, any> {
    const data = localStorage.getItem('amazonasFC_users');
    return data ? JSON.parse(data) : {};
  }
}

export const authService = new AuthService();
