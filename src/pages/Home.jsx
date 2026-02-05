import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
    const { currentUser } = useAuth();

    const features = [
        {
            icon: '📊',
            title: 'Smart Dashboard',
            description: 'Get a complete overview of your financial health with intuitive charts and insights.',
            gradient: 'from-primary-500 to-primary-700',
        },
        {
            icon: '💰',
            title: 'Expense Tracking',
            description: 'Automatically categorize and track your spending with smart rules and CSV import.',
            gradient: 'from-accent-500 to-accent-700',
        },
        {
            icon: '📈',
            title: 'Investment Portfolio',
            description: 'Track your stocks, monitor performance, and stay updated with market news.',
            gradient: 'from-secondary-500 to-secondary-700',
        },
        {
            icon: '🎯',
            title: 'Financial Goals',
            description: 'Set targets, track progress, and achieve your financial milestones.',
            gradient: 'from-success-500 to-success-700',
        },
    ];

    const stats = [
        { value: '10K+', label: 'Active Users' },
        { value: '₹50Cr+', label: 'Tracked' },
        { value: '99.9%', label: 'Uptime' },
        { value: '4.9★', label: 'Rating' },
    ];

    return (
        <div className="relative">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary-500/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-8 animate-fade-in-down">
                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                        Your Personal Finance Command Center
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-surface-900 mb-6 animate-fade-in leading-tight">
                        Take Control of Your{' '}
                        <span className="bg-gradient-to-r from-primary-600 via-accent-500 to-secondary-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
                            Financial Future
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-xl md:text-2xl text-surface-600 mb-10 max-w-3xl mx-auto animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
                        Track expenses, manage investments, and achieve your financial goals with a beautifully designed,
                        all-in-one dashboard built for the modern Indian investor.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        {currentUser ? (
                            <Link
                                to="/dashboard"
                                className="btn-primary btn-lg group"
                            >
                                <span>Go to Dashboard</span>
                                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="btn-primary btn-lg group"
                                >
                                    <span>Get Started Free</span>
                                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <a
                                    href="#features"
                                    className="btn-secondary btn-lg"
                                >
                                    Learn More
                                </a>
                            </>
                        )}
                    </div>

                    {/* Logged-in user info */}
                    {currentUser && (
                        <p className="mt-6 text-surface-600 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                            Welcome back, <span className="font-semibold text-primary-600">{currentUser.email}</span>
                        </p>
                    )}
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 border-y border-surface-200 bg-white/50 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div
                                key={stat.label}
                                className="text-center animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-surface-500 font-medium mt-1">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24">
                <div className="max-w-6xl mx-auto px-4">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-surface-900 mb-4">
                            Everything You Need to{' '}
                            <span className="text-gradient-primary">Manage Money</span>
                        </h2>
                        <p className="text-lg text-surface-600 max-w-2xl mx-auto">
                            Powerful features designed to simplify your financial life and help you make smarter decisions.
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={feature.title}
                                className="card p-6 group hover:shadow-xl animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold text-surface-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-surface-600 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900"></div>
                <div className="absolute inset-0 bg-dots-pattern opacity-20"></div>

                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/30 rounded-full blur-3xl"></div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                        Ready to Transform Your <br className="hidden md:block" />
                        Financial Journey?
                    </h2>
                    <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
                        Join thousands of Indians who are already using ALTA-FI to build wealth and achieve financial freedom.
                    </p>

                    {!currentUser && (
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary-700 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <span>Start Your Journey</span>
                            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    )}

                    {/* Trust badges */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-primary-200 text-sm">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Bank-grade Security</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span>Data Privacy</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            <span>Lightning Fast</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
