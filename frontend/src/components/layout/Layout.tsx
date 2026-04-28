import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 font-sans flex">
      <Sidebar />
      <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pt-16 mt-4">
          <div className="max-w-[1600px] mx-auto w-full px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
