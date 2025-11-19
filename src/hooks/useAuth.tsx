import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'colaborador' | 'cliente';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role using setTimeout to prevent deadlock
          setTimeout(async () => {
            const { data, error } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();
            
            if (data && !error) {
              setUserRole(data.role as UserRole);
            }

            // Check if user must change password
            const { data: profileData } = await supabase
              .from('profiles')
              .select('deve_trocar_senha')
              .eq('id', session.user.id)
              .single();
            
            if (profileData) {
              setMustChangePassword(profileData.deve_trocar_senha || false);
            }
          }, 0);
        } else {
          setUserRole(null);
          setMustChangePassword(false);
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          if (data && !error) {
            setUserRole(data.role as UserRole);
          }

          // Check if user must change password
          const { data: profileData } = await supabase
            .from('profiles')
            .select('deve_trocar_senha')
            .eq('id', session.user.id)
            .single();
          
          if (profileData) {
            setMustChangePassword(profileData.deve_trocar_senha || false);
          }

          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      // Salvar preferência de "lembrar-me"
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        const role = roleData?.role as UserRole;
        setUserRole(role);

        // Redirect based on role
        if (role === 'cliente') {
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signUp = async (email: string, password: string, nome: string, role: UserRole) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Insert role for the new user
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role,
        });
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('rememberMe');
    await supabase.auth.signOut();
    setUserRole(null);
    navigate('/');
  };

  return {
    user,
    session,
    userRole,
    mustChangePassword,
    setMustChangePassword,
    loading,
    signIn,
    signUp,
    signOut,
  };
}