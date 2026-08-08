import Sidebar from "./Sidebar";
import UserMenu from "./UserMenu";

export default function Shell({ children, user }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1">
        <header className="flex items-center justify-end border-b border-border px-8 py-4">
          <UserMenu user={user} />
        </header>
        <main className="mx-auto max-w-7xl px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
