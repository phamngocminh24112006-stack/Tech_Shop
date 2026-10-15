import { useState, useEffect } from 'react';
import cartService from '../services/cartService';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { getProductImage } from '../utils/imageHelper';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const fetchCart = async (accountId) => {
        try {
            const data = await cartService.getCartItems(accountId);
            setCartItems(data);
        } catch (err) {
            console.error('Lỗi tải giỏ hàng:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
            fetchCart(currentUser.account_id);
        } else {
            setLoading(false);
        }
    }, []);

    const handleUpdateQty = async (productId, delta) => {
        if (!user) return;
        try {
            await cartService.addToCart(user.account_id, productId, delta);
            window.dispatchEvent(new Event('cart-updated'));
            fetchCart(user.account_id);
        } catch (error) {
            alert(error.response?.data?.error || error.message || 'Lỗi cập nhật số lượng');
        }
    };

    const handleRemoveItem = async (productId) => {
        if (!user) return;
        if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) return;
        try {
            await cartService.removeFromCart(user.account_id, productId);
            window.dispatchEvent(new Event('cart-updated'));
            fetchCart(user.account_id);
        } catch (error) {
            alert('Lỗi xóa sản phẩm: ' + (error.response?.data?.error || error.message));
        }
    };



    const fmtPrice = (n) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(n);
    };

    if (!user) {
        return (
            <div className="cart-section" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div className="empty-state">
                    <div className="icon">🛒</div>
                    <p style={{ marginBottom: '16px' }}>Vui lòng đăng nhập để xem giỏ hàng.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/login')}>Đăng nhập ngay</button>
                </div>
            </div>
        );
    }

    if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Đang tải giỏ hàng...</div>;

    const total = cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

    return (
        <div className="cart-section">
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', textAlign: 'left' }}>🛒 Giỏ hàng của bạn</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
                
                {/* List items */}
                <div>
                    {cartItems.length === 0 ? (
                        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
                            <div className="empty-state">
                                <div className="icon">🛒</div>
                                <p style={{ marginBottom: '16px' }}>Giỏ hàng của bạn đang trống.</p>
                                <button className="btn btn-outline" onClick={() => navigate('/')}>Mua sắm ngay</button>
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '8px 20px' }}>
                            {cartItems.map(item => (
                                <div key={item.product_id} className="cart-item-row">
                                    <div className="cart-item-img" style={{ overflow: 'hidden', padding: 0 }}>
                                        <img 
                                            src={getProductImage(item)} 
                                            alt={item.name} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>
                                            Đơn giá: {fmtPrice(item.price)}
                                        </div>
                                    </div>
                                    <div className="qty-control">
                                        <button className="qty-btn" onClick={() => handleUpdateQty(item.product_id, -1)}>−</button>
                                        <span style={{ fontWeight: '600', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                        <button className="qty-btn" onClick={() => handleUpdateQty(item.product_id, 1)}>+</button>
                                    </div>
                                    <div style={{ fontWeight: '700', minWidth: '110px', textAlign: 'right', color: 'var(--primary)', fontSize: '15px' }}>
                                        {fmtPrice(item.subtotal)}
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveItem(item.product_id)} 
                                        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '18px', marginLeft: '10px' }}
                                        title="Xóa khỏi giỏ"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Summary & API Code Panel */}
                <div>
                    <div className="order-summary">
                        <div className="card-title" style={{ marginBottom: '16px', fontWeight: '600' }}>Tóm tắt đơn hàng</div>
                        <div className="detail-row">
                            <span className="detail-label">Tạm tính</span>
                            <span>{fmtPrice(total)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Phí vận chuyển</span>
                            <span style={{ color: 'var(--accent)', fontWeight: '600' }}>Miễn phí</span>
                        </div>
                        <div className="detail-row" style={{ borderBottom: 'none', marginTop: '8px' }}>
                            <span className="detail-label" style={{ fontWeight: '700', fontSize: '15px' }}>Tổng cộng</span>
                            <span style={{ fontWeight: '700', fontSize: '18px', color: 'var(--primary)' }}>{fmtPrice(total)}</span>
                        </div>
                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', marginTop: '20px', padding: '12px', fontSize: '14px', fontWeight: '600' }}
                            onClick={() => {
                                if (cartItems.length === 0) return;
                                navigate('/checkout');
                            }}
                            disabled={cartItems.length === 0}
                        >
                            Đặt hàng ngay →
                        </button>
                    </div>

                    <div className="api-panel" style={{ marginTop: '16px' }}>
                        <div className="api-header">
                            <span className="api-title">API MẪU ĐẶT HÀNG</span>
                            <span className="method-badge method-post">POST</span>
                        </div>
                        <pre>
<span className="cmt">// Tạo đơn hàng từ giỏ hàng hiện tại</span>
<span className="kw">POST</span> <span className="str">/api/orders/checkout</span>
{`{
  "account_id": ${user.account_id},
  "receiver_address": "Địa chỉ nhận...",
  "receiver_phone": "Số điện thoại...",
  "payment_method": "COD"
}`}
                        </pre>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Cart;