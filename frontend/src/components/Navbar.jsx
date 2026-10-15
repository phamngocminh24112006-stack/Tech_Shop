import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import cartService from '../services/cartService';

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    const fetchCartCount = (userId) => {
        cartService.getCartItems(userId)
            .then(items => {
                const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
                setCartCount(totalQty);
            })
            .catch(err => console.error("Error loading nav cart count:", err));
    };

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
            fetchCartCount(currentUser.account_id);
        }

        const handleCartUpdate = () => {
            const user = authService.getCurrentUser();
            if (user) {
                fetchCartCount(user.account_id);
            }
        };

        window.addEventListener('cart-updated', handleCartUpdate);
        return () => window.removeEventListener('cart-updated', handleCartUpdate);
    }, [location.pathname]);

    const handleLogout = () => {
        authService.logout();
        setUser(null);
        setCartCount(0);
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    // Do not show default navbar on admin routes
    if (location.pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <nav className="storefront-nav">
            <Link to="/" className="s-logo" style={{ color: '#fff', fontWeight: '700' }}>Tech<span>Shop</span></Link>
            <div className="s-nav-links">
                <Link to="/" className={`s-nav-link ${isActive('/') ? 'active' : ''}`}>Trang chủ</Link>
                {user && (
                    <Link to="/orders" className={`s-nav-link ${isActive('/orders') ? 'active' : ''}`}>Đơn hàng</Link>
                )}
            </div>
            <div className="s-nav-actions">
                <button className="cart-btn" onClick={() => navigate('/cart')}>
                    🛒 Giỏ hàng
                    {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                </button>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {user.role === 'admin' && (
                            <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', padding: '4px 10px', fontSize: '12.5px' }} onClick={() => navigate('/admin')}>
                                ⚙️ Admin
                            </button>
                        )}
                        <span style={{ fontSize: '13.5px', color: '#e2e8f0', fontWeight: '500' }}>{user.username}</span>
                        <div className="avatar" style={{ cursor: 'default' }}>
                            {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <button className="btn" style={{ background: '#ef4444', color: '#fff', padding: '5px 12px', fontSize: '12.5px', borderRadius: '6px', border: 'none', transition: 'all 0.2s', fontWeight: '600' }} onClick={handleLogout}>
                            🚪 Đăng xuất
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Link to="/login" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', padding: '4px 10px', fontSize: '12.5px' }}>Đăng nhập</Link>
                        <Link to="/register" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12.5px' }}>Đăng ký</Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;