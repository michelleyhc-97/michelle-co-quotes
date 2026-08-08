import { Inter } from "next/font/google";
import "./globals.css";
import { AppDataProvider } from "@/lib/store";
import { UserProvider } from "@/lib/UserContext";
import { getCurrentUser } from "@/lib/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Quotes — Michelle & Co. Creatives",
  description: "Internal customer and quotation management tool.",
  robots: "noindex, nofollow",
};

// Root layout applies to every route, including the public /login and
// /q/[id] pages — so it only sets up global providers, not the internal
// dashboard chrome (that's in app/(app)/layout.js instead).
export default async function RootLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <AppDataProvider>
          <UserProvider user={user}>{children}</UserProvider>
        </AppDataProvider>
      </body>
    </html>
  );
}
