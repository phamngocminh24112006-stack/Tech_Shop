import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import authService from '../services/authService';
import { getProductImage } from '../utils/imageHelper';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showSidePanel, setShowSidePanel] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    
    const user = authService.getCurrentUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        orderService.getHistory(user.account_id)
            .then(data => {
                setOrders(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Lỗi tải lịch sử đơn hàng:", err);
                setLoading(false);
            });
    }, []);

    const handleOpenOrderDetails = async (orderId) => {
        setDetailLoading(true);
        setShowSidePanel(true);
        try {
            const details = await orderService.getOrderDetails(orderId);
            setSelectedOrder(details);
        } catch (err) {
            console.error("Lỗi lấy chi tiết đơn hàng:", err);
            alert("Không tìm thấy chi tiết đơn hàng hoặc bạn không có quyền truy cập!");
            setShowSidePanel(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const statusBadge = (s) => {
        const map = { Pending: 'badge-yellow', Shipping: 'badge-blue', Delivered: 'badge-green', Cancelled: 'badge-red' };
        const lbl = { Pending: 'Chờ xử lý', Shipping: 'Đang giao', Delivered: 'Đã giao', Cancelled: 'Đã hủy' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{lbl[s] || s}</span>;
    };

    const fmtPrice = (n) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(n);
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Đang tải lịch sử đơn hàng...</div>;

    return (
        <div className="cart-section">
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', textAlign: 'left' }}>📦 Đơn hàng của tôi</h2>
            
            {orders.length === 0 ? (
                <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div className="empty-state">
                        <div className="icon">📦</div>
                        <p style={{ marginBottom: '16px' }}>Bạn chưa có đơn hàng nào.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/')}>Mua sắm ngay</button>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã ĐH</th>
                                <th>Ngày đặt</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái giao hàng</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.order_id}>
                                    <td><b>#{order.order_id}</b></td>
                                    <td>{new Date(order.order_date).toLocaleDateString('vi-VN')} {new Date(order.order_date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                        {fmtPrice(order.total_amount)}
                                    </td>
                                    <td>{statusBadge(order.delivery_status)}</td>
                                    <td>
                                        <button 
                                            className="btn btn-outline" 
                                            style={{ padding: '4px 10px', fontSize: '12px' }}
                                            onClick={() => handleOpenOrderDetails(order.order_id)}
                                        >
                                            🔍 Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ORDER DETAIL SIDE PANEL */}
            <div className={`side-panel ${showSidePanel ? 'open' : ''}`}>
                <div className="side-panel-header">
                    <div className="card-title" style={{ fontSize: '15px', fontWeight: '700' }}>Chi tiết đơn hàng #{selectedOrder?.id}</div>
                    <button onClick={() => setShowSidePanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-2)' }}>✕</button>
                </div>
                {detailLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-2)' }}>Đang tải chi tiết đơn hàng...</div>
                ) : selectedOrder ? (
                    <div className="side-panel-body">
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700' }}>Thông tin đơn hàng</div>
                            <div className="detail-row"><span className="detail-label">Người mua</span><span>{selectedOrder.user || 'Khách hàng'}</span></div>
                            <div className="detail-row"><span className="detail-label">Ngày đặt</span><span>{new Date(selectedOrder.date).toLocaleString('vi-VN')}</span></div>
                            <div className="detail-row"><span className="detail-label">Địa chỉ nhận</span><span style={{ fontSize: '12px', textAlign: 'right', maxWidth: '60%' }}>{selectedOrder.receiver_address}</span></div>
                            <div className="detail-row"><span className="detail-label">Số điện thoại</span><span>{selectedOrder.receiver_phone}</span></div>
                            <div className="detail-row"><span className="detail-label">Vận chuyển</span><span>{selectedOrder.shipper || 'Chờ chỉ định'}</span></div>
                            <div className="detail-row">
                                <span className="detail-label">Trạng thái giao</span>
                                {statusBadge(selectedOrder.status)}
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Trạng thái thanh toán</span>
                                <span className={`badge ${selectedOrder.payment === 'Completed' ? 'badge-green' : selectedOrder.payment === 'Refunded' ? 'badge-purple' : 'badge-yellow'}`}>
                                    {{ Completed: 'Đã thanh toán', Refunded: 'Hoàn tiền', Pending: 'Chờ thanh toán' }[selectedOrder.payment] || selectedOrder.payment}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700' }}>Danh sách sản phẩm mua</div>
                            {selectedOrder.items?.map((item, idx) => (
                                <div key={idx} className="detail-row" style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <img 
                                            src={getProductImage(item)} 
                                            alt={item.name} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Số lượng: {item.quantity}</div>
                                    </div>
                                    <span style={{ fontWeight: '600' }}>{fmtPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
                            <div className="detail-row" style={{ border: 'none', padding: '0' }}>
                                <span style={{ fontWeight: '700', fontSize: '13px' }}>Tổng thanh toán đơn</span>
                                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--primary)' }}>{fmtPrice(selectedOrder.amount)}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-2)' }}>Không có dữ liệu đơn hàng</div>
                )}
            </div>

            {/* BACKDROP OVERLAY TO CLOSE PANEL ON CLICK OUTSIDE */}
            {showSidePanel && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.3)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        zIndex: 140,
                    }}
                    onClick={() => setShowSidePanel(false)}
                />
            )}
        </div>
    );
};

export default Orders;