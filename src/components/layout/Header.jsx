import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/auth';

const Header = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        const result = await logout();
        if (result.success) {
            navigate('/');
        }
    };

    return (
        <header className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
            <nav className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold text-white hover:text-primary-100 transition-colors">
                        ALTA-FI
                    </Link>

                    <div className="flex items-center gap-6">
                        {currentUser ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="text-white hover:text-primary-100 transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/finance"
                                    className="text-white hover:text-primary-100 transition-colors"
                                >
                                    Finance
                                </Link>
                                <Link
                                    to="/investments"
                                    className="text-white hover:text-primary-100 transition-colors"
                                >
                                    📈 Investments
                                </Link>
                                <div className="flex items-center gap-3">
                                    <span className="text-primary-100 text-sm">
                                        {currentUser.email}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors shadow-md"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors shadow-md"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
