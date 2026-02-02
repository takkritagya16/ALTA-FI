import Header from './Header';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50">
            <Header />
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
