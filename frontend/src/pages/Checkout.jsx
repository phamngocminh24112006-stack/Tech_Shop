import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cartService from '../services/cartService';
import authService from '../services/authService';
import orderService from '../services/orderService';
import { getShippers } from '../services/adminService';

const Checkout = () => {
    const [cartItems, setCartItems] = useState([]);
    const [shippers, setShippers] = useState([]);
    const [formData, setFormData] = useState({
        receiver_address: '',
        receiver_phone: '',
        shipper_id: '',
        payment_method: 'COD'
    });
    const [loading, setLoading] = useState(false);
    
    const user = authService.getCurrentUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        setFormData(prev => ({
            ...prev,
            receiver_address: user.address || '',
            receiver_phone: user.phone || ''
        }));

        cartService.getCartItems(user.account_id).then(setCartItems);

        // Fetch shippers from backend
        getShippers()
            .then(data => {
                setShippers(data);
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, shipper_id: data[0].shipper_id }));
                }
            })
            .catch(err => console.error("Error loading shippers:", err));
    }, []);

    const total = cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) {
            alert('Giỏ hàng trống!');
            return;
        }

        setLoading(true);
        try {
            await orderService.checkout({
                account_id: user.account_id,
                ...formData,
                shipper_id: parseInt(formData.shipper_id)
            });
            window.dispatchEvent(new Event('cart-updated'));
            alert('Đặt hàng thành công!');
            navigate('/orders');
        } catch (error) {
            alert('Lỗi đặt hàng: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const fmtPrice = (n) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(n);
    };

    return (
        <div className="cart-section" style={{ maxWidth: '900px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', textAlign: 'left' }}>📦 Đặt hàng</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
                
                {/* Form thông tin giao hàng */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 className="card-title" style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Thông tin giao hàng</h3>
                    <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Địa chỉ nhận hàng</label>
                            <input 
                                type="text" 
                                name="receiver_address" 
                                value={formData.receiver_address} 
                                onChange={handleChange} 
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Số điện thoại liên hệ</label>
                            <input 
                                type="text" 
                                name="receiver_phone" 
                                value={formData.receiver_phone} 
                                onChange={handleChange} 
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Đơn vị vận chuyển</label>
                            <select 
                                name="shipper_id" 
                                value={formData.shipper_id} 
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                {shippers.map(s => (
                                    <option key={s.shipper_id} value={s.shipper_id}>
                                        {s.shipper_name} {s.phone ? `(${s.phone})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phương thức thanh toán</label>
                            <select 
                                name="payment_method" 
                                value={formData.payment_method} 
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                                <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                                <option value="E_WALLET">Ví điện tử (Momo, VNPay)</option>
                            </select>
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading || cartItems.length === 0}
                            className="btn btn-primary"
                            style={{ padding: '12px', width: '100%', marginTop: '8px', fontWeight: '600', fontSize: '14px' }}
                        >
                            {loading ? 'Đang xử lý...' : 'Xác nhận Đặt hàng ngay →'}
                        </button>
                    </form>
                </div>

                {/* Tóm tắt đơn hàng */}
                <div>
                    <div className="order-summary">
                        <div className="card-title" style={{ marginBottom: '16px', fontWeight: '600' }}>Tóm tắt đơn hàng</div>
                        <div style={{ display: 'flex', flexType: 'column', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                            {cartItems.map(item => (
                                <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: 'var(--text-2)' }}>{item.name} <span style={{ fontWeight: '600' }}>x{item.quantity}</span></span>
                                    <span style={{ fontWeight: '500' }}>{fmtPrice(item.subtotal)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="detail-row" style={{ borderBottom: 'none', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                            <span style={{ fontWeight: '700', fontSize: '14px' }}>Tổng thanh toán</span>
                            <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--primary)' }}>{fmtPrice(total)}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Checkout;