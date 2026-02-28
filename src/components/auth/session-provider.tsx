"use client";

import { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionUser } from "@/types/auth";

type SessionContextValue = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  fetching: boolean;
};

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  fetching: true,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["session-user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      if (!response.ok) {
        return null;
      }
      const json = await response.json();
      return json.user as SessionUser | null;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
  });

  return (
    <SessionContext.Provider
      value={{
        user: data ?? null,
        loading: isLoading,
        fetching: isFetching,
        refresh: async () => {
          await refetch();
          await queryClient.invalidateQueries({ queryKey: ["session-user"] });
        },
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
