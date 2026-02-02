import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
    const { currentUser } = useAuth();

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Welcome to your protected dashboard!
                    </p>
                </div>

                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-semibold text-primary-900 mb-4">
                        User Information
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-primary-700 font-medium">Email:</span>
                            <span className="text-primary-900 font-semibold">{currentUser?.email}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-primary-700 font-medium">User ID:</span>
                            <span className="text-primary-900 font-mono text-sm">{currentUser?.uid}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-primary-700 font-medium">Account Created:</span>
                            <span className="text-primary-900">
                                {currentUser?.metadata?.creationTime
                                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                                    : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                        ✅ Session Persistence Active
                    </h3>
                    <p className="text-green-700">
                        Your session is persisted locally. Even if you close the browser and return,
                        you'll remain logged in until you explicitly log out.
                    </p>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-6 rounded-xl text-center">
                        <div className="text-3xl mb-2">🔒</div>
                        <h4 className="font-semibold text-gray-800 mb-1">Protected Route</h4>
                        <p className="text-sm text-gray-600">This page requires authentication</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-xl text-center">
                        <div className="text-3xl mb-2">📧</div>
                        <h4 className="font-semibold text-gray-800 mb-1">Email Auth</h4>
                        <p className="text-sm text-gray-600">Secure email/password login</p>
                    </div>
                    <div className="bg-pink-50 p-6 rounded-xl text-center">
                        <div className="text-3xl mb-2">💾</div>
                        <h4 className="font-semibold text-gray-800 mb-1">Firestore Ready</h4>
                        <p className="text-sm text-gray-600">Database integration available</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
