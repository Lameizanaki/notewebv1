import Sidebar from '@/Components/Sidebar';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const DESKTOP_BREAKPOINT = 1024;
const SIDEBAR_MIN_WIDTH = 260;
const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_DEFAULT_WIDTH = 296;

function clampWidth(value) {
    return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));
}

export default function AppLayout({ title, actions, children }) {
    const { flash, auth } = usePage().props;
    const workspaceRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const savedOpen = window.localStorage.getItem('quicknote.sidebar.open');
        const savedWidth = window.localStorage.getItem('quicknote.sidebar.width');

        if (savedOpen !== null) {
            setSidebarOpen(savedOpen === 'true');
        }

        if (savedWidth !== null) {
            setSidebarWidth(clampWidth(Number(savedWidth)));
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem('quicknote.sidebar.open', String(sidebarOpen));
    }, [sidebarOpen]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem('quicknote.sidebar.width', String(sidebarWidth));
    }, [sidebarWidth]);

    useEffect(() => {
        if (!isResizing) {
            return undefined;
        }

        const previousCursor = document.body.style.cursor;
        const previousUserSelect = document.body.style.userSelect;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (event) => {
            if (!workspaceRef.current) {
                return;
            }

            const bounds = workspaceRef.current.getBoundingClientRect();
            const nextWidth = clampWidth(event.clientX - bounds.left - 12);
            setSidebarWidth(nextWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.body.style.cursor = previousCursor;
            document.body.style.userSelect = previousUserSelect;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const toggleSidebar = () => {
        if (typeof window !== 'undefined' && window.innerWidth < DESKTOP_BREAKPOINT) {
            setMobileSidebarOpen((current) => !current);
            return;
        }

        setSidebarOpen((current) => !current);
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_24%)]" />

            <div ref={workspaceRef} className="relative flex min-h-screen w-full gap-3 px-3 py-3 sm:px-4 lg:gap-5 lg:px-5">
                <div
                    className={`hidden shrink-0 overflow-hidden transition-[width,opacity] duration-200 lg:block ${
                        sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                    }`}
                    style={{ width: sidebarOpen ? `${sidebarWidth}px` : '0px' }}
                >
                    <div className="sticky top-0 h-[calc(100vh-1.5rem)] py-1">
                        <Sidebar user={auth.user} className="h-full" />
                    </div>
                </div>

                {sidebarOpen ? (
                    <div className="relative hidden lg:flex">
                        <button
                            type="button"
                            onMouseDown={() => setIsResizing(true)}
                            className="group flex w-4 cursor-col-resize items-center justify-center"
                            aria-label="Resize sidebar"
                        >
                            <span className="h-24 w-1 rounded-full bg-slate-800 transition group-hover:bg-emerald-300/70" />
                        </button>
                    </div>
                ) : null}

                <main className="min-w-0 flex-1 pb-6">
                    <div className="mb-5 flex flex-col gap-4 rounded-[2rem] border border-slate-800/90 bg-slate-900/82 p-5 shadow-[0_30px_80px_rgba(2,6,23,0.36)] md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <button
                                type="button"
                                onClick={toggleSidebar}
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/70 text-slate-300 transition hover:border-slate-500 hover:text-white"
                                aria-label={sidebarOpen || mobileSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                            >
                                {sidebarOpen || mobileSidebarOpen ? '||' : '='}
                            </button>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">{title}</h1>
                                <p className="mt-1 text-sm text-slate-400">
                                    More room for writing, with a sidebar you can collapse or drag wider.
                                </p>
                            </div>
                        </div>

                        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
                    </div>

                    {flash.success ? (
                        <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            {flash.success}
                        </div>
                    ) : null}

                    {children}
                </main>
            </div>

            <div
                className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition lg:hidden ${
                    mobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={() => setMobileSidebarOpen(false)}
            />

            <div
                className={`fixed inset-y-0 left-0 z-50 w-[min(86vw,22rem)] p-3 transition-transform duration-200 lg:hidden ${
                    mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <Sidebar
                    user={auth.user}
                    className="h-full"
                    onClose={() => setMobileSidebarOpen(false)}
                    showMobileClose
                />
            </div>
        </div>
    );
}
