import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
    const { currentUser } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="text-center max-w-2xl">
                <h1 className="text-6xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    Welcome to ALTA-FI
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    A modern React application with Firebase Phone OTP authentication,
                    protected routes, and session persistence.
                </p>

                {currentUser ? (
                    <div className="space-y-4">
                        <p className="text-lg text-gray-700">
                            You're logged in with: <span className="font-semibold text-primary-600">{currentUser.email}</span>
                        </p>
                        <Link
                            to="/dashboard"
                            className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                ) : (
                    <Link
                        to="/login"
                        className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Get Started
                    </Link>
                )}
            </div>
        </div>
    );
};

export default Home;
