import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] relative">
            {/* Decorative background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="text-center relative z-10 animate-fade-in">
                {/* 404 Number */}
                <div className="relative inline-block mb-8">
                    <h1 className="text-[150px] lg:text-[200px] font-display font-bold leading-none bg-gradient-to-br from-primary-400 via-primary-600 to-accent-500 bg-clip-text text-transparent">
                        404
                    </h1>
                    <div className="absolute inset-0 text-[150px] lg:text-[200px] font-display font-bold leading-none text-primary-500/10 blur-2xl">
                        404
                    </div>
                </div>

                {/* Message */}
                <h2 className="text-3xl lg:text-4xl font-display font-bold text-surface-900 mb-4">
                    Oops! Page Not Found
                </h2>
                <p className="text-lg text-surface-600 mb-8 max-w-md mx-auto">
                    The page you're looking for doesn't exist or has been moved to a new location.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/"
                        className="btn-primary btn-lg group"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>Go Home</span>
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="btn-secondary btn-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        <span>Go Back</span>
                    </button>
                </div>

                {/* Fun fact */}
                <div className="mt-12 pt-8 border-t border-surface-200">
                    <p className="text-sm text-surface-500">
                        💡 Fun fact: The 404 error was named after a room at CERN where the first web servers were housed.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
