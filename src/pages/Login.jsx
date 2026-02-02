import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginWithEmail, registerWithEmail } from '../services/auth';

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false);

    // Email State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        let result;
        if (isRegistering) {
            result = await registerWithEmail(email, password);
        } else {
            result = await loginWithEmail(email, password);
        }

        setLoading(false);

        if (result.success) {
            setSuccess(isRegistering ? 'Account created! Redirecting...' : 'Login successful! Redirecting...');
            setTimeout(() => navigate('/dashboard'), 1000);
        } else {
            let msg = result.error;
            if (result.code === 'auth/email-already-in-use') msg = 'Email is already registered.';
            if (result.code === 'auth/user-not-found') msg = 'User not found.';
            if (result.code === 'auth/wrong-password') msg = 'Incorrect password.';
            if (result.code === 'auth/invalid-email') msg = 'Invalid email address.';
            setError(msg || 'Authentication failed.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-gray-600 text-sm">
                        {isRegistering ? 'Sign up with your email' : 'Sign in with your email'}
                    </p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}

                {/* Email/Password Form */}
                <form onSubmit={handleEmailAuth} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                            required
                            minLength={6}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Log In')}
                    </button>

                    <div className="text-center text-sm text-gray-500">
                        {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                        <button
                            type="button"
                            onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccess(''); }}
                            className="text-primary-600 font-semibold hover:text-primary-800"
                        >
                            {isRegistering ? 'Log In' : 'Sign Up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
