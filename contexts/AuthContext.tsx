import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Types
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'candidate' | 'employer';
}

export interface AuthSession {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

interface AuthContextType {
    user: AuthUser | null;
    session: AuthSession | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signUp: (email: string, password: string, name: string, role: 'candidate' | 'employer') => Promise<{ success: boolean; error?: string }>;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = (typeof window !== 'undefined' && (window as any).__VITE_API_URL__) || '';

// Storage keys
const STORAGE_KEYS = {
    USER: 'lune_user',
    SESSION: 'lune_session',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load stored auth on mount
    useEffect(() => {
        const loadStoredAuth = async () => {
            try {
                const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
                const storedSession = localStorage.getItem(STORAGE_KEYS.SESSION);

                if (storedUser && storedSession) {
                    const parsedUser = JSON.parse(storedUser);
                    const parsedSession = JSON.parse(storedSession);

                    // Check if session is expired
                    if (parsedSession.expires_at * 1000 > Date.now()) {
                        setUser(parsedUser);
                        setSession(parsedSession);
                    } else {
                        // Try to refresh the token
                        await refreshToken(parsedSession.refresh_token);
                    }
                }
            } catch (error) {
                console.error('Error loading stored auth:', error);
                clearStorage();
            } finally {
                setIsLoading(false);
            }
        };

        loadStoredAuth();
    }, []);

    const clearStorage = () => {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    };

    const saveToStorage = (userData: AuthUser, sessionData: AuthSession) => {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
    };

    const refreshToken = async (refreshToken: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();

            if (data.session) {
                setSession(data.session);
                const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    saveToStorage(parsedUser, data.session);
                }
                return true;
            }
            return false;
        } catch {
            clearStorage();
            setUser(null);
            setSession(null);
            return false;
        }
    };

    const signUp = useCallback(async (
        email: string,
        password: string,
        name: string,
        role: 'candidate' | 'employer'
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);

            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error || 'Signup failed' };
            }

            // After signup, automatically log in
            return await login(email, password);
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (
        email: string,
        password: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);

            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error || 'Invalid credentials' };
            }

            const userData: AuthUser = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                role: data.user.role,
            };

            const sessionData: AuthSession = {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
            };

            setUser(userData);
            setSession(sessionData);
            saveToStorage(userData, sessionData);

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            if (session?.access_token) {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setSession(null);
            clearStorage();
        }
    }, [session]);

    const value: AuthContextType = {
        user,
        session,
        isLoading,
        isAuthenticated: !!user && !!session,
        signUp,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
