import Header from './Header';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-surface-50 bg-gradient-mesh relative overflow-x-hidden">
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Top-right decorative blob */}
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl"></div>
                {/* Bottom-left decorative blob */}
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent-500/10 blur-3xl"></div>
                {/* Center subtle accent */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-secondary-500/5 blur-3xl"></div>
            </div>

            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="container mx-auto px-4 lg:px-8 py-8 relative z-10">
                <div className="animate-fade-in">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 mt-auto border-t border-surface-200 bg-white/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Logo & Copyright */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-sm">A</span>
                            </div>
                            <div>
                                <span className="font-display font-semibold text-surface-800">ALTA-FI</span>
                                <p className="text-xs text-surface-500">© 2026 All rights reserved</p>
                            </div>
                        </div>

                        {/* Links */}
                        <div className="flex items-center gap-6 text-sm">
                            <a href="#" className="text-surface-500 hover:text-primary-600 transition-colors">Privacy</a>
                            <a href="#" className="text-surface-500 hover:text-primary-600 transition-colors">Terms</a>
                            <a href="#" className="text-surface-500 hover:text-primary-600 transition-colors">Support</a>
                        </div>

                        {/* Built with love */}
                        <div className="flex items-center gap-2 text-sm text-surface-500">
                            <span>Built with</span>
                            <span className="text-danger-500 animate-pulse-glow">❤️</span>
                            <span>for your finances</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
