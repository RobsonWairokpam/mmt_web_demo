"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { api, setAccessToken } from "../lib/api";
import { useRouter } from "next/navigation";
// import { useRouter } from "next/router";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  isSeller?: boolean;
  isAuctioneer?: boolean;
  sellerId?: string;
  bidderId?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  loginWithGoogle: () => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await api.get("/auth/session");

        const token = response.data.access_token ?? response.data.accessToken;

        if (token) {
          setAccessToken(token);
        }

        if (active) {
          setUser(response.data.user ?? null);
        }
      } catch {
        setAccessToken(null);

        setUser(null);
        router.push("/login");

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, []);
  async function loginWithEmail(email: string, password: string) {
    setLoading(true);

    console.log(email, password, "login cre");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      console.log({ data: response, dada1: response.data });

      const { accessToken, user } = response.data;

      setAccessToken(accessToken);
      setUser(user);
      router.push("/");
      // Change this to your actual protected page.
    } catch (error) {
      setAccessToken(null);
      setLoading(false);

      setUser(null);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      const res = await api.post("/auth/logout");
      console.log(res, "logut");
      alert(res.data.message);
      return;
    } finally {
      setLoading(false);
      setAccessToken(null);
      setUser(null);
      router.push("/login");
    }
  }

  function loginWithGoogle() {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithGoogle, loginWithEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
