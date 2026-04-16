import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Scissors, Calendar, Users, Briefcase, LogOut, History, Loader2, User, Settings2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setUserProfile(data);
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success("Sesión cerrada correctamente");
        navigate('/login');
    };

    const isAdmin = userProfile?.rol === 'admin';

    // Menu logic: Diferenciamos por rol y por plataforma
    const menuItems = [
        { icon: <Calendar size={20} />, label: 'Agenda', path: '/dashboard', show: true },
        { icon: <Settings2 size={20} />, label: 'Config', path: '/dashboard/configuracion', show: true },
        { icon: <Briefcase size={20} />, label: 'Servicios', path: '/dashboard/servicios', show: isAdmin },
        { icon: <Users size={20} />, label: 'Staff', path: '/dashboard/staff', show: isAdmin },
        { icon: <History size={20} />, label: 'Logs', path: '/dashboard/auditoria', show: isAdmin },
    ];

    const activeItems = menuItems.filter(item => item.show);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070a13] flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#070a13] text-slate-300 overflow-hidden font-sans selection:bg-blue-500/30">

            {/* --- SIDEBAR (DESKTOP) --- */}
            <aside className="hidden lg:flex w-72 bg-[#0b0f1a] border-r border-white/5 flex-col shrink-0 relative z-50 shadow-2xl">
                <div className="p-8 flex flex-col h-full">
                    {/* Brand */}
                    <div className="flex items-center gap-3 mb-10 group cursor-default">
                        <div className="p-2.5 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/30 text-white transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                            <Scissors size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-2xl text-white tracking-tighter uppercase italic leading-none">IMPERIO</span>
                            <span className="font-bold text-[10px] text-blue-500 uppercase tracking-[0.4em] mt-1">OPERATING SYSTEM</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2 flex-1">
                        {activeItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 font-black uppercase text-[11px] tracking-widest group
                                    ${isActive
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                                        : 'text-slate-500 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer / Profile */}
                    <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                        <div className="flex items-center gap-3 px-2 bg-slate-900/40 p-4 rounded-3xl border border-white/5 shadow-inner">
                            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-lg relative bg-gradient-to-br from-slate-800 to-slate-900">
                                {userProfile?.foto_url ? (
                                    <img src={userProfile.foto_url} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-slate-600" />
                                )}
                                {isAdmin && <div className="absolute top-0 right-0 p-0.5 bg-blue-500 rounded-bl-lg text-white"><ShieldCheck size={8} /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter mb-0.5">{userProfile?.nombre_completo || 'Staff'}</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{userProfile?.rol}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-3 px-5 py-4 w-full rounded-2xl text-red-500/80 hover:text-red-500 hover:bg-red-500/5 transition-all font-black uppercase text-[10px] tracking-widest border border-transparent hover:border-red-500/10"
                        >
                            <LogOut size={16} /> Salir
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#070a13] relative overflow-hidden">

                {/* Mobile Top Header */}
                <header className="lg:hidden h-20 bg-[#0b0f1a] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-40">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl text-white -rotate-6">
                            <Scissors size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-white tracking-tighter text-lg uppercase italic">IMPERIO</span>
                            <span className="font-bold text-[8px] text-blue-500 uppercase tracking-[0.2em]">OPERATING SYSTEM</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLogout}
                            className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center transition-colors hover:bg-red-500/20 active:scale-95"
                        >
                            <LogOut size={18} />
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/configuracion')}
                            className={`w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center overflow-hidden transition-all active:scale-90 ${location.pathname === '/dashboard/configuracion' ? 'ring-2 ring-blue-500' : ''}`}
                        >
                            {userProfile?.foto_url ? <img src={userProfile.foto_url} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-600" />}
                        </button>
                    </div>
                </header>

                {/* SCROLLABLE SECTION */}
                <main className="flex-1 overflow-y-auto w-full flex flex-col px-4 md:px-8 lg:px-12 py-8 lg:py-12 custom-scrollbar pb-32 lg:pb-12">
                    <div className="w-full max-w-[1200px] mx-auto flex-1 h-fit">
                        <Outlet />
                    </div>
                </main>

                {/* --- BOTTOM NAVIGATION (MOBILE) --- */}
                <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-[#0b0f1a]/95 backdrop-blur-3xl border-t border-white/10 px-2 py-4 flex items-center justify-around z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    {activeItems.map((item) => {
                        const isActive = item.path === '/dashboard'
                            ? location.pathname === '/dashboard'
                            : location.pathname.startsWith(item.path);

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                className={() => `
                                    relative flex flex-col items-center justify-center w-16 gap-1 transition-all duration-300
                                    ${isActive
                                        ? 'text-white'
                                        : 'text-slate-500/80 hover:text-white'}
                                `}
                            >
                                <span className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(37,99,235,0.6)] text-blue-500' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-blue-500' : ''}`}>
                                    {item.label}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

