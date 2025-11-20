import { supabase } from "@/utils/Supabase";
import { createContext, useEffect, useState } from "react";


interface AuthContextProps {
    user: any,
    isLoading: boolean,
    login: (email: string, password: string) => Promise<any>,
    register: (email: string, password: string, username:string) => Promise<any>,
    logout: () => void
    updateProfile: (profileData: Partial<any>) => Promise<any>,
}


export const AuthContext = createContext({} as AuthContextProps);

export const AuthProvider = ({ children }: any) => {

    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

   const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            console.log("Entró - login start", { email });

            // Llamada a Supabase
            const res = await supabase.auth.signInWithPassword({ email, password });
            console.log("signInWithPassword response:", res);

            const { data, error } = res;
            if (error) {
                console.error('Login error (supabase):', error);
                setIsLoading(false);
                return false;
            }

            if (!data?.user) {
                console.error('Login error: no user returned', data);
                setIsLoading(false);
                return false;
            }

            console.log("Login correcto, obteniendo perfil", { userId: data.user.id });

            // Fetch profile desde 'profiles' por id = auth user id
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                console.warn('Profile fetch error:', profileError);
                // fallback mínimo: usar datos de auth
                setUser({
                    id: data.user.id,
                    email: data.user.email,
                    name: (data.user.user_metadata as any)?.name ?? data.user.email?.split('@')[0]
                });
            } else {
                setUser(profileData);
            }

            setIsLoading(false);
            return true;
        } catch (err) {
            console.error('Login exception:', err);
            setIsLoading(false);
            return false;
        }
    }

    const updateProfile = async (profileData: Partial<any>) => {
        if (!user?.id) {
            console.error('No user ID available');
            return false;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    ...profileData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) {
                console.error('Update profile error:', error.message);
                throw new Error(error.message);
            }

            setUser({
                ...user,
                ...profileData
            });

            return true;
        } catch (error) {
            console.error('Update profile error:', error);
            return false;
        }
    };

        const register = async (email: string, password: string, username: string) => {
          try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
              return { success: false, error: error.message };
            }

            // Si el usuario se creó correctamente, crea el perfil
            const user = data.user;
            if (user) {
              const { error: profileError } = await supabase
                .from("profiles")
                .insert([
                  {
                    id: user.id, 
                    email: user.email,
                    username: username,
                    age: null,
                    height: null,
                    weight: null,
                    weight_goal: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    ROL: 'USER'
                  },
                ]);
              if (profileError) {
                return { success: false, error: profileError.message };
              }
            }

            return { success: true };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
          }
    }

    const logout = async () => {
        setUser(null);
    }

    useEffect(() => {
    // Al montar, intenta obtener el usuario autenticado y cargar su profile
    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const authUser = data?.user ?? null;
        if (authUser) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          if (!profileError && profileData) {
            setUser(profileData);
          } else {
            setUser({
              id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.name ?? authUser.email?.split('@')[0]
            });
          }
        }
      } catch (e) {
        console.error('Init auth error', e);
      }
    };

    init();

    // Suscribirse a cambios de sesión (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null;
      if (!authUser) {
        setUser(null);
        return;
      }
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (!profileError && profileData) setUser(profileData);
        else setUser({ id: authUser.id, email: authUser.email });
      } catch (err) {
        console.error('Auth state change error', err);
      }
    });

    return () => {
      // cleanup
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

    return <AuthContext.Provider
        value={{
            user,
            isLoading,
            login,
            register,
            logout,
            updateProfile
        }}
    >
        {children}
    </AuthContext.Provider>
}