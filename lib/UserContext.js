"use client";

import { createContext, useContext } from "react";

const UserContext = createContext(null);

/** Wraps the app with the currently logged-in user (or null on public
 * pages like /login and /q/[id]), read server-side and passed in. */
export function UserProvider({ user, children }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}

export function useIsBoss() {
  const user = useUser();
  return user?.role === "boss";
}
