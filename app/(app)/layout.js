import Shell from "@/components/Shell";
import { getCurrentUser } from "@/lib/auth";

// Applies only to the internal, authenticated pages (dashboard, customers,
// quotes) — proxy.js guarantees `user` is non-null here since every route
// under this group requires a valid session.
export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  return <Shell user={user}>{children}</Shell>;
}
