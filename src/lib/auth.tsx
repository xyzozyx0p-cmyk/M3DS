import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { friendlyError } from "./errors";

const TOKEN_KEY = "cubeworld.token";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

interface AuthValue {
  user: SessionUser | null | undefined;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, name: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  const meQuery = useQuery(api.users.me, token ? { token } : "skip");
  const register = useMutation(api.users.register);
  const login = useMutation(api.users.login);
  const logout = useMutation(api.users.logout);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await login({ email, password });
        if (!result.ok) throw new Error(result.error);
        setToken(result.token);
      } catch (error) {
        throw new Error(friendlyError(error, "Не удалось войти"));
      }
    },
    [login],
  );

  const signUp = useCallback(
    async (email: string, name: string, password: string) => {
      try {
        const result = await register({ email, name, password });
        if (!result.ok) throw new Error(result.error);
        setToken(result.token);
      } catch (error) {
        throw new Error(friendlyError(error, "Не удалось зарегистрироваться"));
      }
    },
    [register],
  );

  const signOut = useCallback(async () => {
    if (token) {
      try {
        await logout({ token });
      } catch {
        // Даже если сервер недоступен, просто забываем локальную сессию.
      }
    }
    setToken(null);
  }, [logout, token]);

  const value = useMemo<AuthValue>(
    () => ({
      user: token ? (meQuery ?? undefined) : null,
      token,
      signIn,
      signUp,
      signOut,
    }),
    [meQuery, signIn, signOut, signUp, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth должен вызываться внутри AuthProvider");
  return value;
}
