import { supabase } from "@/utils/Supabase";
import { createContext, useState } from "react";


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
        try {
            // Authenticate with Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                console.error('Login error:', error.message);
                return false;
            }

            if (data.user) {
                // Fetch complete user profile from profiles table
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    console.error('Profile fetch error:', profileError.message);
                    // Fallback: use basic auth data if profile fetch fails
                    setUser({
                        id: data.user.id,
                        email: data.user.email!,
                        name: data.user.user_metadata.name || data.user.email!.split('@')[0]
                    });
                } else {
                    // Set complete profile data
                    setUser(profileData);
                }

                return true;
            }

            return false;
        } catch (error) {
            console.error('Login error:', error);
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
                    id: user.id, // El mismo id que en auth.users
                    email: user.email,
                    name: "", // Puedes poner valores por defecto o vacíos
                    username: username,
                    bio: "",
                    phone: "",
                    gender: "",
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