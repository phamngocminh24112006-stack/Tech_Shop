import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import authService from '../services/authService';
import { getProductImage } from '../utils/imageHelper';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    // Navigation state
    const [activeTab, setActiveTab] = useState('dashboard');
    const [pageTitle, setPageTitle] = useState('Dashboard');

    // Data states
    const [dashboardData, setDashboardData] = useState(null);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null); // for detail panel
    const [customers, setCustomers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [shippers, setShippers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [reviews, setReviews] = useState([]);

    // Analytics states
    const [priceSegments, setPriceSegments] = useState([]);
    const [shipperStats, setShipperStats] = useState([]);
    const [customerTiers, setCustomerTiers] = useState([]);

    // Filtering / Search states
    const [prodSearch, setProdSearch] = useState('');
    const [prodCatFilter, setProdCatFilter] = useState('');
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [userTierFilter, setUserTierFilter] = useState('');

    // Modal visibility states
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showSidePanel, setShowSidePanel] = useState(false);

    // Form inputs states
    const [newProduct, setNewProduct] = useState({
        name: '', brand: '', category: 'Laptop', price: '', stock_quantity: '', warranty_period: '12', description: ''
    });
    const [importForm, setImportForm] = useState({
        product_id: '', supplier_id: '', quantity: '50'
    });

    // Loading / Toast states
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    };

    // Redirect to login if not admin
    useEffect(() => {
        if (!user || user.role !== 'admin') {
            alert('Bạn không có quyền truy cập trang quản trị!');
            navigate('/login');
        }
    }, [user, navigate]);

    // Fetch initial data
    const fetchDashboard = async () => {
        try {
            const res = await api.get('/analytics/dashboard');
            setDashboardData(res.data);
        } catch (err) {
            console.error("Lỗi fetch dashboard stats:", err);
        }
    };

    useEffect(() => {
        if (user && user.role === 'admin') {
            setLoading(true);
            Promise.all([
                fetchDashboard(),
                api.get('/products/search').then(res => {
                    setProducts(res.data);
                    if (res.data.length > 0) {
                        setImportForm(prev => ({ ...prev, product_id: res.data[0].product_id }));
                    }
                }),
                api.get('/orders').then(res => setOrders(res.data)),
                api.get('/users').then(res => setCustomers(res.data)),
                api.get('/suppliers/inventory').then(res => setInventory(res.data)),
                api.get('/suppliers').then(res => {
                    setSuppliers(res.data);
                    if (res.data.length > 0) {
                        setImportForm(prev => ({ ...prev, supplier_id: res.data[0].supplier_id }));
                    }
                }),
                api.get('/shippers').then(res => setShippers(res.data)),
                api.get('/orders/payments/all').then(res => setPayments(res.data)),
                api.get('/reviews').then(res => setReviews(res.data)),
                api.get('/analytics/price-segments').then(res => setPriceSegments(res.data)),
                api.get('/analytics/shipper-performance').then(res => setShipperStats(res.data)),
                api.get('/analytics/customer-tiers').then(res => setCustomerTiers(res.data))
            ]).catch(err => {
                showToast("Lỗi đồng bộ dữ liệu hệ thống", "error");
                console.error(err);
            }).finally(() => setLoading(false));
        }
    }, []);

    const handleTabChange = (tabId, title) => {
        setActiveTab(tabId);
        setPageTitle(title);
        setShowSidePanel(false);
        // Refresh dashboard data if switching back to dashboard
        if (tabId === 'dashboard') {
            fetchDashboard();
        }
    };

    // Product CRUD Operations
    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/products', {
                ...newProduct,
                price: parseFloat(newProduct.price),
                stock_quantity: parseInt(newProduct.stock_quantity),
                warranty_period: parseInt(newProduct.warranty_period)
            });
            setProducts(prev => [res.data, ...prev]);
            setShowAddProductModal(false);
            setNewProduct({ name: '', brand: '', category: 'Laptop', price: '', stock_quantity: '', warranty_period: '12', description: '' });
            showToast(`✅ Đã thêm sản phẩm: ${res.data.name}`, 'success');
        } catch (err) {
            showToast(err.response?.data?.error || err.message, 'error');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(prev => prev.filter(p => p.product_id !== id));
            showToast("Xóa sản phẩm thành công!", "success");
        } catch (err) {
            // Trigger 20 trg_prevent_delete_product will fail if order details exist
            showToast(`Lỗi: ${err.response?.data?.error || "Sản phẩm đã phát sinh giao dịch (Trigger #20)"}`, "error");
        }
    };

    // Order status modifications
    const handleOpenOrderDetails = async (orderId) => {
        try {
            const res = await api.get(`/orders/${orderId}`);
            setSelectedOrder(res.data);
            setShowSidePanel(true);
        } catch (err) {
            showToast("Không tìm thấy chi tiết đơn hàng", "error");
        }
    };

    const handleUpdateStatus = async (orderId, status) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status });
            showToast(`Cập nhật đơn #${orderId} → ${status}`, 'success');
            // Refresh orders list
            const res = await api.get('/orders');
            setOrders(res.data);
            // Refresh active selected order details
            handleOpenOrderDetails(orderId);
            fetchDashboard();
        } catch (err) {
            showToast(`Lỗi cập nhật: ${err.response?.data?.error || err.message}`, 'error');
        }
    };

    // Inventory operations
    const handleRestock = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/suppliers/inventory', {
                product_id: parseInt(importForm.product_id),
                supplier_id: parseInt(importForm.supplier_id),
                quantity: parseInt(importForm.quantity)
            });
            // Reload products and inventory logs
            const [prodRes, invRes] = await Promise.all([
                api.get('/products/search'),
                api.get('/suppliers/inventory')
            ]);
            setProducts(prodRes.data);
            setInventory(invRes.data);
            setShowImportModal(false);
            showToast(`✅ ${res.data.message || "Nhập hàng thành công!"}`, 'success');
            fetchDashboard();
        } catch (err) {
            showToast(`Lỗi nhập hàng: ${err.response?.data?.error || err.message}`, 'error');
        }
    };

    const fmtPrice = (n) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(n);
    };



    // Filters logic
    const filteredProducts = products.filter(p => {
        const matchSearch = !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.brand.toLowerCase().includes(prodSearch.toLowerCase());
        const matchCat = !prodCatFilter || p.category === prodCatFilter;
        return matchSearch && matchCat;
    });

    const filteredOrders = orders.filter(o => {
        const matchSearch = !orderSearch || String(o.id).includes(orderSearch) || o.user.toLowerCase().includes(orderSearch.toLowerCase());
        const matchStatus = !orderStatusFilter || o.status === orderStatusFilter;
        return matchSearch && matchStatus;
    });

    const filteredUsers = customers.filter(u => {
        const matchSearch = !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
        const matchTier = !userTierFilter || u.tier === userTierFilter;
        return matchSearch && matchTier;
    });

    if (!user || user.role !== 'admin') return null;
    if (loading) return <div style={{ textAlign: 'center', padding: '100px', fontSize: '18px' }}>Đang khởi tạo hệ thống quản trị...</div>;

    const stats = dashboardData?.stats || { monthlyRevenue: 0, totalOrders: 0, newUsers: 0, lowStockCount: 0 };
    const chartData = dashboardData?.monthlyRevenueChart || [];
    const recentOrders = dashboardData?.recentOrders || [];
    const topProducts = dashboardData?.topProducts || [];
    const categoryStats = dashboardData?.categoryStats || [];

    const maxChartVal = chartData.length > 0 ? Math.max(...chartData.map(c => c.revenue)) : 1;

    return (
        <div id="admin-app" className="app">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <span>TechShop <span className="badge">Admin</span></span>
                </div>
                <div className="sidebar-section">Tổng quan</div>
                <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('dashboard', 'Dashboard')}>
                    <span className="icon">📊</span><span>Dashboard</span>
                </div>
                <div className="sidebar-section">Quản lý</div>
                <div className={`nav-item ${activeTab === 'products-admin' ? 'active' : ''}`} onClick={() => handleTabChange('products-admin', 'Sản phẩm')}>
                    <span className="icon">📦</span><span>Sản phẩm</span>
                </div>
                <div className={`nav-item ${activeTab === 'orders-admin' ? 'active' : ''}`} onClick={() => handleTabChange('orders-admin', 'Đơn hàng')}>
                    <span className="icon">🛒</span><span>Đơn hàng</span>
                    {orders.filter(o => o.status === 'Pending').length > 0 && (
                        <span className="nav-badge">{orders.filter(o => o.status === 'Pending').length}</span>
                    )}
                </div>
                <div className={`nav-item ${activeTab === 'users-admin' ? 'active' : ''}`} onClick={() => handleTabChange('users-admin', 'Khách hàng')}>
                    <span className="icon">👥</span><span>Khách hàng</span>
                </div>
                <div className={`nav-item ${activeTab === 'inventory-admin' ? 'active' : ''}`} onClick={() => handleTabChange('inventory-admin', 'Kho hàng')}>
                    <span className="icon">🏭</span><span>Kho hàng</span>
                </div>
                <div className={`nav-item ${activeTab === 'payments-admin' ? 'active' : ''}`} onClick={() => handleTabChange('payments-admin', 'Thanh toán')}>
                    <span className="icon">💳</span><span>Thanh toán</span>
                </div>
                <div className={`nav-item ${activeTab === 'reviews-admin' ? 'active' : ''}`} onClick={() => handleTabChange('reviews-admin', 'Đánh giá')}>
                    <span className="icon">⭐</span><span>Đánh giá</span>
                </div>
                <div className="sidebar-section">Báo cáo</div>
                <div className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => handleTabChange('analytics', 'Phân tích BI')}>
                    <span className="icon">📈</span><span>Phân tích BI</span>
                </div>
                <div className="sidebar-section">Hệ thống</div>
                <div className={`nav-item ${activeTab === 'api-docs' ? 'active' : ''}`} onClick={() => handleTabChange('api-docs', 'API & Schema')}>
                    <span className="icon">🔌</span><span>API & Schema</span>
                </div>
                <div className="nav-item" onClick={() => navigate('/')} style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="icon">🏪</span><span>Xem Storefront</span>
                </div>
            </aside>

            {/* MAIN MAIN CONTENT */}
            <div className="main">
                {/* TOPBAR */}
                <div className="topbar">
                    <h1>{pageTitle}</h1>
                    <div className="topbar-actions">
                        <button className="btn btn-primary" onClick={() => setShowAddProductModal(true)}>+ Thêm SP</button>
                        <div className="avatar" title="Quay lại Store" onClick={() => navigate('/')}>AD</div>
                    </div>
                </div>

                {/* ==================== DASHBOARD TAB ==================== */}
                {activeTab === 'dashboard' && (
                    <div className="page active">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-label">💰 Doanh thu tháng này</div>
                                <div className="stat-value">{fmtPrice(stats.monthlyRevenue)}</div>
                                <div className="stat-change up">▲ Thành công đã giao</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">📦 Tổng đơn hàng</div>
                                <div className="stat-value">{stats.totalOrders}</div>
                                <div className="stat-change up">Đơn hàng trong DB</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">👥 Khách mới tháng này</div>
                                <div className="stat-value">{stats.newUsers}</div>
                                <div className="stat-change up">Tài khoản mới</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">⚠️ Tồn kho thấp</div>
                                <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.lowStockCount}</div>
                                <div className="stat-change down">Sản phẩm ≤ 5 chiếc</div>
                            </div>
                        </div>

                        <div className="two-col">
                            <div className="card" style={{ textAlign: 'left' }}>
                                <div className="card-header">
                                    <div className="card-title">📈 Doanh thu thực tế theo tháng ({new Date().getFullYear()})</div>
                                </div>
                                <div style={{ padding: '16px' }}>
                                    <div className="chart-placeholder">
                                        {chartData.map((c, i) => (
                                            <div 
                                                key={i} 
                                                className="chart-bar" 
                                                style={{ height: `${c.revenue > 0 ? (c.revenue / maxChartVal * 100) : 10}%` }}
                                                data-val={c.revenue > 1000000 ? `${(c.revenue / 1000000).toFixed(1)}M` : fmtPrice(c.revenue)} 
                                                title={`${c.month}: ${fmtPrice(c.revenue)}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="chart-labels">
                                        {chartData.map((c, i) => <div key={i} className="chart-label">{c.month}</div>)}
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ textAlign: 'left' }}>
                                <div className="card-header"><div class="card-title">🏷️ Danh mục & Tồn kho</div></div>
                                <div style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div className="pie-chart" style={{ flexShrink: 0 }}></div>
                                    <div style={{ flex: 1 }}>
                                        {categoryStats.slice(0, 4).map((c, idx) => {
                                            const colors = ['var(--primary)', 'var(--accent)', '#f59e0b', '#ef4444'];
                                            return (
                                                <div key={idx} style={{ marginBottom: '12px' }}>
                                                    <div style={{ display: 'flex', justifySpaceBetween: 'space-between', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                                        <span>{c.category || 'N/A'}</span>
                                                        <span style={{ fontWeight: '600' }}>{c.stock || 0} SP</span>
                                                    </div>
                                                    <div className="progress-bar">
                                                        <div 
                                                            className="progress-fill" 
                                                            style={{ width: `${Math.min(100, (c.stock || 0) / 2)}%`, background: colors[idx % 4] }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="three-col">
                            <div className="card" style={{ textAlign: 'left' }}>
                                <div className="card-header">
                                    <div className="card-title">🕐 Đơn hàng gần đây</div>
                                    <button className="btn btn-outline" onClick={() => handleTabChange('orders-admin', 'Đơn hàng')}>Xem tất cả</button>
                                </div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Mã ĐH</th>
                                            <th>Người mua</th>
                                            <th>Tổng tiền</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((o, i) => (
                                            <tr key={i} onClick={() => handleOpenOrderDetails(o.id)} style={{ cursor: 'pointer' }}>
                                                <td><b>#{o.id}</b></td>
                                                <td>{o.user || 'Khách vãng lai'}</td>
                                                <td style={{ fontWeight: '600' }}>{fmtPrice(o.amount)}</td>
                                                <td>
                                                    <span className={`badge ${{ Pending: 'badge-yellow', Shipping: 'badge-blue', Delivered: 'badge-green', Cancelled: 'badge-red' }[o.status] || 'badge-gray'}`}>
                                                        {o.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="card" style={{ textAlign: 'left' }}>
                                <div className="card-header"><div class="card-title">⭐ Top Sản phẩm đánh giá cao</div></div>
                                <div style={{ padding: '8px 0' }}>
                                    {topProducts.map((p, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderBottom: '1px solid #f3f4f6' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <img 
                                                    src={getProductImage(p)} 
                                                    alt={p.name} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>★ {Number(p.rating).toFixed(1)} ({p.reviews} review)</div>
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>{fmtPrice(p.price)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================== PRODUCTS TAB ==================== */}
                {activeTab === 'products-admin' && (
                    <div className="page active">
                        <div className="search-bar">
                            <input 
                                className="input" 
                                placeholder="🔍 Tìm sản phẩm..." 
                                value={prodSearch} 
                                onChange={(e) => setProdSearch(e.target.value)} 
                                style={{ flex: 1, maxWidth: '360px' }}
                            />
                            <select 
                                className="input" 
                                value={prodCatFilter} 
                                onChange={(e) => setProdCatFilter(e.target.value)}
                            >
                                <option value="">Tất cả danh mục</option>
                                <option value="Laptop">Laptop</option>
                                <option value="Phone">Điện thoại (Phone)</option>
                                <option value="Phụ kiện">Phụ kiện</option>
                                <option value="Monitor">Màn hình (Monitor)</option>
                                <option value="PC">Máy tính (PC)</option>
                                <option value="VGA">VGA</option>
                                <option value="CPU">CPU</option>
                            </select>
                            <button className="btn btn-primary" onClick={() => setShowAddProductModal(true)}>+ Thêm sản phẩm</button>
                        </div>

                        <div className="card" style={{ textAlign: 'left' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Sản phẩm</th>
                                        <th>Danh mục</th>
                                        <th>Hãng</th>
                                        <th>Giá</th>
                                        <th>Tồn kho</th>
                                        <th>Bảo hành</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(p => (
                                        <tr key={p.product_id}>
                                            <td style={{ color: 'var(--text-3)' }}>#{p.product_id}</td>
                                            <td><b>{p.name}</b></td>
                                            <td><span className="badge badge-blue">{p.category}</span></td>
                                            <td>{p.brand}</td>
                                            <td style={{ fontWeight: '600' }}>{fmtPrice(p.price)}</td>
                                            <td style={{ fontWeight: '700' }}>
                                                {p.stock_quantity <= 5 ? (
                                                    <span style={{ color: 'var(--danger)' }}>⚠️ {p.stock_quantity}</span>
                                                ) : (
                                                    p.stock_quantity
                                                )}
                                            </td>
                                            <td>{p.warranty_period}th</td>
                                            <td>
                                                <span className={`badge ${p.stock_quantity > 0 ? 'badge-green' : 'badge-red'}`}>
                                                    {p.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => handleDeleteProduct(p.product_id)}>
                                                    🗑️ Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="api-panel" style={{ marginTop: '16px' }}>
                            <div className="api-header"><span className="api-title">SQL Query - Lấy danh sách sản phẩm (Query #37)</span><span class="method-badge method-get">SELECT</span></div>
                            <pre>
<span className="cmt">-- Query lọc sản phẩm nâng cao</span>
<span className="kw">SELECT</span> p.*, <span className="kw">COALESCE</span>(<span className="kw">ROUND</span>(<span className="kw">AVG</span>(r.rating), <span className="num">1</span>), <span className="num">0.0</span>) <span className="kw">AS</span> rating, <span className="kw">COUNT</span>(r.rating) <span className="kw">AS</span> reviews
<span className="kw">FROM</span> product p
<span className="kw">LEFT JOIN</span> review r <span class="kw">ON</span> p.product_id = r.product_id
<span className="kw">WHERE</span> p.name <span className="kw">ILIKE</span> <span className="str">'%keyword%'</span> <span className="kw">AND</span> p.category = <span className="str">'Laptop'</span>
<span className="kw">GROUP BY</span> p.product_id
<span className="kw">ORDER BY</span> p.price <span className="kw">ASC</span>;
                            </pre>
                        </div>
                    </div>
                )}

                {/* ==================== ORDERS TAB ==================== */}
                {activeTab === 'orders-admin' && (
                    <div className="page active">
                        <div className="search-bar">
                            <input 
                                className="input" 
                                placeholder="🔍 Tìm đơn hàng, người mua..." 
                                value={orderSearch} 
                                onChange={(e) => setOrderSearch(e.target.value)} 
                                style={{ flex: 1, maxWidth: '360px' }}
                            />
                            <select 
                                className="input" 
                                value={orderStatusFilter} 
                                onChange={(e) => setOrderStatusFilter(e.target.value)}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="Pending">Pending (Chờ xử lý)</option>
                                <option value="Shipping">Shipping (Đang giao)</option>
                                <option value="Delivered">Delivered (Đã giao)</option>
                                <option value="Cancelled">Cancelled (Đã hủy)</option>
                            </select>
                        </div>

                        <div className="card" style={{ textAlign: 'left' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Mã ĐH</th>
                                        <th>Người mua</th>
                                        <th>Ngày đặt</th>
                                        <th>Tổng tiền</th>
                                        <th>Vận chuyển</th>
                                        <th>Trạng thái</th>
                                        <th>Thanh toán</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(o => (
                                        <tr key={o.id}>
                                            <td><b>#{o.id}</b></td>
                                            <td>{o.user || 'Khách hàng'}</td>
                                            <td>{new Date(o.date).toLocaleDateString('vi-VN')}</td>
                                            <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{fmtPrice(o.amount)}</td>
                                            <td>{o.shipper || <span style={{ color: 'var(--text-3)' }}>Chưa chỉ định</span>}</td>
                                            <td>
                                                <span className={`badge ${{ Pending: 'badge-yellow', Shipping: 'badge-blue', Delivered: 'badge-green', Cancelled: 'badge-red' }[o.status] || 'badge-gray'}`}>
                                                    {{ Pending: 'Chờ xử lý', Shipping: 'Đang giao', Delivered: 'Đã giao', Cancelled: 'Đã hủy' }[o.status] || o.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${o.payment === 'Completed' ? 'badge-green' : o.payment === 'Refunded' ? 'badge-purple' : 'badge-yellow'}`}>
                                                    {{ Completed: 'Đã thanh toán', Refunded: 'Hoàn tiền', Pending: 'Chờ thanh toán' }[o.payment] || o.payment}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => handleOpenOrderDetails(o.id)}>
                                                    🔍 Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="api-panel" style={{ marginTop: '16px' }}>
                            <div className="api-header"><span className="api-title">Trigger - Tự động hóa cập nhật trạng thái đơn (Trigger #28)</span><span class="method-badge method-put">TRIGGER</span></div>
                            <pre>
<span className="cmt">-- Khi payment_status chuyển sang 'Completed', cập nhật delivery_status sang 'Shipping'</span>
<span className="kw">CREATE OR REPLACE FUNCTION</span> auto_update_order_status()
<span className="kw">RETURNS TRIGGER AS</span> $$
<span className="kw">BEGIN</span>
  <span className="kw">IF</span> NEW.payment_status = <span class="str">'Completed'</span> <span class="kw">THEN</span>
    <span class="kw">UPDATE</span> orders <span class="kw">SET</span> delivery_status = <span class="str">'Shipping'</span>
    <span class="kw">WHERE</span> order_id = NEW.order_id <span class="kw">AND</span> delivery_status = <span class="str">'Pending'</span>;
  <span class="kw">END IF</span>;
  <span class="kw">RETURN NEW</span>;
<span class="kw">END</span>;
$$ <span class="kw">LANGUAGE</span> plpgsql;
                            </pre>
                        </div>
                    </div>
                )}

                {/* ==================== CUSTOMERS TAB ==================== */}
                {activeTab === 'users-admin' && (
                    <div className="page active">
                        <div className="search-bar">
                            <input 
                                className="input" 
                                placeholder="🔍 Tìm khách hàng..." 
                                value={userSearch} 
                                onChange={(e) => setUserSearch(e.target.value)} 
                                style={{ flex: 1, maxWidth: '360px' }}
                            />
                            <select 
                                className="input" 
                                value={userTierFilter} 
                                onChange={(e) => setUserTierFilter(e.target.value)}
                            >
                                <option value="">Tất cả hạng</option>
                                <option value="S-VIP">S-VIP (≥ 50M)</option>
                                <option value="S-Member">S-Member (20M-50M)</option>
                                <option value="S-New">S-New (&lt; 20M)</option>
                            </select>
                        </div>

                        <div className="card" style={{ textAlign: 'left' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Họ tên</th>
                                        <th>Email</th>
                                        <th>Số điện thoại</th>
                                        <th>Địa chỉ</th>
                                        <th>Số đơn đã mua</th>
                                        <th>Chi tiêu trọn đời (LTV)</th>
                                        <th>Hạng thành viên</th>
                                        <th>Tài khoản</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.id}>
                                            <td>#{u.id}</td>
                                            <td><b>{u.name}</b></td>
                                            <td style={{ color: 'var(--primary)' }}>{u.email}</td>
                                            <td>{u.phone || 'N/A'}</td>
                                            <td style={{ fontSize: '12px' }}>{u.address || 'N/A'}</td>
                                            <td style={{ fontWeight: '500' }}>{u.total_orders}</td>
                                            <td style={{ fontWeight: '600' }}>{fmtPrice(u.spend)}</td>
                                            <td>
                                                <span className={`badge ${u.tier === 'S-VIP' ? 'badge-red' : u.tier === 'S-Member' ? 'badge-blue' : 'badge-gray'}`}>
                                                    {u.tier}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                                                    {u.status === 'active' ? 'Active' : 'Locked'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="api-panel" style={{ marginTop: '16px' }}>
                            <div className="api-header"><span className="api-title">SQL Query - Thống kê LTV & Phân loại S-Member (Query #5)</span><span class="method-badge method-get">SELECT</span></div>
                            <pre>
<span className="cmt">-- Phân hạng thành viên dựa trên tổng chi tiêu đơn hàng đã hoàn tất</span>
<span className="kw">WITH</span> CustomerStats <span class="kw">AS</span> (
  <span class="kw">SELECT</span> u.user_id, u.full_name, <span class="kw">SUM</span>(o.total_amount) <span class="kw">AS</span> lifetime_value
  <span class="kw">FROM</span> users u
  <span class="kw">JOIN</span> accounts a <span class="kw">ON</span> u.user_id = a.user_id
  <span class="kw">JOIN</span> orders o <span class="kw">ON</span> a.account_id = o.account_id
  <span class="kw">WHERE</span> o.delivery_status = <span class="str">'Delivered'</span>
  <span class="kw">GROUP BY</span> u.user_id, u.full_name
)
<span className="kw">SELECT</span> user_id, full_name, lifetime_value,
  <span class="kw">CASE</span>
    <span class="kw">WHEN</span> lifetime_value &gt;= <span class="num">50000000</span> <span class="kw">THEN</span> <span class="str">'S-VIP'</span>
    <span class="kw">WHEN</span> lifetime_value &gt;= <span class="num">20000000</span> <span class="kw">THEN</span> <span class="str">'S-Member'</span>
    <span class="kw">ELSE</span> <span class="str">'S-New'</span>
  <span class="kw">END AS</span> membership_tier
<span className="kw">FROM</span> CustomerStats;
                            </pre>
                        </div>
                    </div>
                )}

                {/* ==================== INVENTORY TAB ==================== */}
                {activeTab === 'inventory-admin' && (
                    <div className="page active">
                        <div className="search-bar">
                            <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>+ Nhập hàng vào kho</button>
                        </div>

                        <div className="card" style={{ textAlign: 'left' }}>
                            <div className="card-header"><div class="card-title">🏭 Mức tồn kho sản phẩm</div></div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Sản phẩm</th>
                                        <th>Danh mục</th>
                                        <th>Hãng sản xuất</th>
                                        <th>Số lượng tồn</th>
                                        <th>Mức cảnh báo</th>
                                        <th>Trạng thái tồn kho</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => {
                                        const isLow = p.stock_quantity <= 5;
                                        return (
                                            <tr key={p.product_id}>
                                                <td>#{p.product_id}</td>
                                                <td><b>{p.name}</b></td>
                                                <td>{p.category}</td>
                                                <td>{p.brand}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <b style={{ minWidth: '24px' }}>{p.stock_quantity}</b>
                                                        <div className="progress-bar" style={{ flex: 1, maxWidth: '100px' }}>
                                                            <div 
                                                                className="progress-fill" 
                                                                style={{ width: `${Math.min(100, p.stock_quantity * 8)}%`, background: isLow ? '#f59e0b' : 'var(--accent)' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>5 chiếc</td>
                                                <td>
                                                    <span className={`badge ${p.stock_quantity === 0 ? 'badge-red' : isLow ? 'badge-yellow' : 'badge-green'}`}>
                                                        {p.stock_quantity === 0 ? 'Hết hàng' : isLow ? 'Sắp hết hàng' : 'Đủ hàng'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="card" style={{ marginTop: '24px', textAlign: 'left' }}>
                            <div className="card-header"><div class="card-title">📜 Nhật ký lịch sử nhập kho</div></div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Thời gian</th>
                                        <th>Sản phẩm</th>
                                        <th>Nhà cung cấp</th>
                                        <th>Số lượng nhập</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map((inv, i) => (
                                        <tr key={i}>
                                            <td>{new Date(inv.create_at).toLocaleString('vi-VN')}</td>
                                            <td><b>{inv.product_name}</b> (ID: #{inv.product_id})</td>
                                            <td>{inv.supplier_name}</td>
                                            <td style={{ fontWeight: '700', color: 'var(--accent)' }}>+{inv.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="api-panel" style={{ marginTop: '16px' }}>
                            <div className="api-header"><span className="api-title">Trigger - Tự động cảnh báo tồn kho thấp (Trigger #24)</span><span class="method-badge method-put">TRIGGER</span></div>
                            <pre>
<span className="cmt">-- Khi cập nhật số lượng tồn kho &lt; 2, sinh Notice cảnh báo hệ thống</span>
<span className="kw">CREATE OR REPLACE FUNCTION</span> notify_low_stock()
<span className="kw">RETURNS TRIGGER AS</span> $$
<span className="kw">BEGIN</span>
  <span className="kw">IF</span> NEW.stock_quantity &lt; <span class="num">2</span> <span class="kw">THEN</span>
    <span class="kw">RAISE NOTICE</span> <span class="str">'Canh bao: SP % sap het hang!'</span>, NEW.name;
  <span class="kw">END IF</span>;
  <span class="kw">RETURN NEW</span>;
<span class="kw">END</span>;
$$ <span class="kw">LANGUAGE</span> plpgsql;
                            </pre>
                        </div>
                    </div>
                )}

                {/* ==================== PAYMENTS TAB ==================== */}
                {activeTab === 'payments-admin' && (
                    <div className="page active">
                        <div className="card" style={{ textAlign: 'left' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Mã TT</th>
                                        <th>Mã ĐH</th>
                                        <th>Ngày thanh toán</th>
                                        <th>Số tiền</th>
                                        <th>Phương thức</th>
                                        <th>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map(p => (
                                        <tr key={p.id}>
                                            <td>#{p.id}</td>
                                            <td><b>#{p.orderid}</b></td>
                                            <td>{new Date(p.date).toLocaleString('vi-VN')}</td>
                                            <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{fmtPrice(p.amount)}</td>
                                            <td>{p.method}</td>
                                            <td>
                                                <span className={`badge ${p.status === 'Completed' ? 'badge-green' : p.status === 'Refunded' ? 'badge-purple' : 'badge-yellow'}`}>
                                                    {{ Completed: 'Đã thanh toán', Refunded: 'Hoàn tiền', Pending: 'Chờ thanh toán' }[p.status] || p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="api-panel" style={{ marginTop: '16px' }}>
                            <div className="api-header"><span className="api-title">Function - Tính tổng tiền chi tiêu tài khoản (Function #14)</span><span class="method-badge method-get">FUNCTION</span></div>
                            <pre>
<span className="cmt">-- Gọi: SELECT get_account_total_spend(1);</span>
<span className="kw">CREATE OR REPLACE FUNCTION</span> get_account_total_spend(p_account_id <span class="kw">INT</span>)
<span className="kw">RETURNS DECIMAL AS</span> $$
<span className="kw">DECLARE</span> total <span class="kw">DECIMAL</span>;
<span className="kw">BEGIN</span>
  <span class="kw">SELECT SUM</span>(total_amount) <span class="kw">INTO</span> total
  <span class="kw">FROM</span> orders
  <span class="kw">WHERE</span> account_id = p_account_id <span class="kw">AND</span> delivery_status = <span class="str">'Delivered'</span>;
  <span class="kw">RETURN COALESCE</span>(total, <span class="num">0</span>);
<span class="kw">END</span>;
$$ <span class="kw">LANGUAGE</span> plpgsql;
                            </pre>
                        </div>
                    </div>
                )}

                {/* ==================== REVIEWS TAB ==================== */}
                {activeTab === 'reviews-admin' && (
                    <div className="page active">
                        <div className="card" style={{ textAlign: 'left' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th>Tài khoản</th>
                                        <th>Khách hàng</th>
                                        <th>Đánh giá</th>
                                        <th>Nhận xét</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reviews.map((r, i) => (
                                        <tr key={i}>
                                            <td><b>{r.product_name}</b> (ID: #{r.product_id})</td>
                                            <td style={{ color: 'var(--primary)' }}>{r.username}</td>
                                            <td>{r.reviewer_name}</td>
                                            <td>
                                                <span className="stars">{'★'.repeat(Math.round(r.rating)) + '☆'.repeat(5 - Math.round(r.rating))}</span>
                                                <span style={{ fontSize: '12px', marginLeft: '4px' }}>({r.rating}/5)</span>
                                            </td>
                                            <td style={{ color: 'var(--text-2)', maxWidth: '400px' }}>{r.comment}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="api-panel" style={{ marginTop: '16px' }}>
                            <div className="api-header"><span className="api-title">Trigger - Ràng buộc review chỉ khi đã mua hàng (Trigger #22)</span><span class="method-badge method-put">TRIGGER</span></div>
                            <pre>
<span className="cmt">-- Kiểm tra tài khoản đã mua sản phẩm và đơn hàng được 'Delivered' trước khi cho phép review</span>
<span className="kw">CREATE OR REPLACE FUNCTION</span> check_review_permission()
<span className="kw">RETURNS TRIGGER AS</span> $$
<span className="kw">BEGIN</span>
  <span className="kw">IF NOT EXISTS</span> (
    <span class="kw">SELECT</span> <span class="num">1</span> <span class="kw">FROM</span> orders o 
    <span class="kw">JOIN</span> order_item oi <span class="kw">ON</span> o.order_id = oi.order_id 
    <span class="kw">WHERE</span> o.account_id = NEW.account_id <span class="kw">AND</span> oi.product_id = NEW.product_id <span class="kw">AND</span> o.delivery_status = <span class="str">'Delivered'</span>
  ) <span class="kw">THEN</span>
    <span class="kw">RAISE EXCEPTION</span> <span class="str">'Chi duoc danh gia san pham da mua!'</span>;
  <span class="kw">END IF</span>;
  <span class="kw">RETURN NEW</span>;
<span class="kw">END</span>;
$$ <span class="kw">LANGUAGE</span> plpgsql;
                            </pre>
                        </div>
                    </div>
                )}

                {/* ==================== ANALYTICS BI TAB ==================== */}
                {activeTab === 'analytics' && (
                    <div className="page active">
                        <div className="two-col">
                            {/* Phân khúc khoảng giá */}
                            <div className="card" style={{ textAlign: 'left' }}>
                                <div className="card-header"><div class="card-title">💰 Phân tích phân khúc khoảng giá (Query #7)</div></div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Phân khúc giá</th>
                                            <th>Sản phẩm bán ra</th>
                                            <th>Doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {priceSegments.map((seg, idx) => (
                                            <tr key={idx}>
                                                <td><span className="badge badge-purple">{seg.price_segment}</span></td>
                                                <td>{seg.total_units_sold} chiếc</td>
                                                <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{fmtPrice(seg.total_segment_revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Cặp sản phẩm mua cùng nhau */}
                            <div className="card" style={{ textAlign: 'left' }}>
                                <div className="card-header"><div class="card-title">🔗 Sản phẩm thường mua cùng nhau (Query #8)</div></div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Cặp sản phẩm</th>
                                            <th>Số lần xuất hiện chung</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>MacBook Pro 14" + Magic Mouse</td>
                                            <td><span className="badge badge-green">47 lần</span></td>
                                        </tr>
                                        <tr>
                                            <td>iPhone 15 Pro Max + AirPods Pro 2</td>
                                            <td><span className="badge badge-green">38 lần</span></td>
                                        </tr>
                                        <tr>
                                            <td>Dell XPS 15 + USB-C Adapter Hub</td>
                                            <td><span className="badge badge-blue">29 lần</span></td>
                                        </tr>
                                        <tr>
                                            <td>iPad Pro M2 + Apple Pencil 2</td>
                                            <td><span className="badge badge-blue">24 lần</span></td>
                                        </tr>
                                        <tr>
                                            <td>Samsung Galaxy S24 + Bao da ClearView</td>
                                            <td><span className="badge badge-yellow">19 lần</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Hiệu suất giao hàng Shipper */}
                        <div className="card" style={{ marginTop: '20px', textAlign: 'left' }}>
                            <div className="card-header"><div class="card-title">🚚 Hiệu suất giao hàng đơn vị vận chuyển (Query #12)</div></div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Đơn vị vận chuyển</th>
                                        <th>Tổng số đơn nhận</th>
                                        <th>Tỉ lệ giao thành công (%)</th>
                                        <th>Đánh giá chất lượng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shipperStats.map((s, idx) => {
                                        const rate = parseFloat(s.success_rate);
                                        const badgeType = rate >= 95 ? 'badge-green' : rate >= 90 ? 'badge-blue' : 'badge-yellow';
                                        const label = rate >= 95 ? 'Xuất sắc' : rate >= 90 ? 'Tốt' : 'Trung bình';
                                        return (
                                            <tr key={idx}>
                                                <td><b>{s.shipper_name}</b></td>
                                                <td>{s.total_orders} đơn</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <b style={{ minWidth: '40px' }}>{s.success_rate}%</b>
                                                        <div className="progress-bar" style={{ flex: 1, maxWidth: '200px' }}>
                                                            <div 
                                                                className="progress-fill" 
                                                                style={{ width: `${rate}%`, background: rate >= 95 ? 'var(--accent)' : rate >= 90 ? 'var(--primary)' : '#f59e0b' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><span className={`badge ${badgeType}`}>{label}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ==================== API SCHEMA TAB ==================== */}
                {activeTab === 'api-docs' && (
                    <div className="page active" style={{ textAlign: 'left' }}>
                        <div className="two-col">
                            <div className="card">
                                <div className="card-header"><div class="card-title">📋 Database Tables Schema</div></div>
                                <div style={{ padding: '16px 20px', maxHeight: '450px', overflowY: 'auto' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>product</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>product_id (PK), name, price, brand, category, stock_quantity, warranty_period, description, image_url</div>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>orders</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>order_id (PK), account_id (FK), shipper_id (FK), order_date, total_amount, receiver_address, receiver_phone, delivery_status, delivered_at</div>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>users</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>user_id (PK), full_name, phone, email, address</div>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>accounts</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>account_id (PK), user_id (FK), username, password, role, status</div>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>cart_item / order_item</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>cart_id/order_id (FK), product_id (FK), quantity, unit_price</div>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>review</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>account_id (FK), product_id (FK), rating, comment</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header"><div class="card-title">⚡ Database Triggers List</div></div>
                                <div style={{ padding: '16px 20px', maxHeight: '450px', overflowY: 'auto' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <span className="badge badge-yellow" style={{ marginRight: '8px' }}>Trigger #20</span><b>trg_prevent_delete_product</b>
                                        <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>Chặn xóa sản phẩm đã phát sinh giao dịch trong đơn hàng.</div>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <span className="badge badge-yellow" style={{ marginRight: '8px' }}>Trigger #21</span><b>trg_cart_quantity</b>
                                        <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>Kiểm tra số lượng thêm vào giỏ hàng không vượt quá tồn kho.</div>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <span className="badge badge-yellow" style={{ marginRight: '8px' }}>Trigger #22</span><b>trg_review_permission</b>
                                        <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>Chỉ cho phép review sản phẩm đối với những tài khoản đã mua sản phẩm đó.</div>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <span className="badge badge-yellow" style={{ marginRight: '8px' }}>Trigger #27</span><b>trg_decrease_stock</b>
                                        <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>Tự động giảm tồn kho sản phẩm tương ứng khi khách đặt hàng.</div>
                                    </div>
                                    <div>
                                        <span className="badge badge-yellow" style={{ marginRight: '8px' }}>Trigger #29</span><b>trg_update_total_amount</b>
                                        <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>Tự động tính toán lại tổng giá trị đơn hàng khi chèn, sửa hoặc xóa item.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ marginTop: '20px' }}>
                            <div className="card-header"><div class="card-title">🔌 Active REST API Routes</div></div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Method</th>
                                        <th>Endpoint</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><span className="method-badge method-get">GET</span></td>
                                        <td><code>/api/products/search</code></td>
                                        <td>Tìm kiếm sản phẩm (hỗ trợ category, keyword).</td>
                                    </tr>
                                    <tr>
                                        <td><span className="method-badge method-post">POST</span></td>
                                        <td><code>/api/products</code></td>
                                        <td>Tạo sản phẩm mới (Admin only).</td>
                                    </tr>
                                    <tr>
                                        <td><span className="method-badge method-delete">DELETE</span></td>
                                        <td><code>/api/products/:id</code></td>
                                        <td>Xóa sản phẩm (Kiểm tra giao dịch qua Trigger #20).</td>
                                    </tr>
                                    <tr>
                                        <td><span className="method-badge method-get">GET</span></td>
                                        <td><code>/api/orders</code></td>
                                        <td>Lấy toàn bộ lịch sử đơn hàng của hệ thống.</td>
                                    </tr>
                                    <tr>
                                        <td><span className="method-badge method-put">PUT</span></td>
                                        <td><code>/api/orders/:id/status</code></td>
                                        <td>Cập nhật trạng thái đơn (Pending, Shipping, Delivered, Cancelled).</td>
                                    </tr>
                                    <tr>
                                        <td><span className="method-badge method-post">POST</span></td>
                                        <td><code>/api/suppliers/inventory</code></td>
                                        <td>Thực hiện restock nhập kho và chèn nhật ký.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD PRODUCT MODAL */}
            <div className={`modal-overlay ${showAddProductModal ? 'open' : ''}`} onClick={(e) => e.target.className.includes('modal-overlay') && setShowAddProductModal(false)}>
                <div className="modal">
                    <div className="modal-header">
                        <h3 className="modal-title">Thêm sản phẩm mới</h3>
                        <button className="modal-close" onClick={() => setShowAddProductModal(false)}>✕</button>
                    </div>
                    <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="form-group">
                            <label className="form-label">Tên sản phẩm</label>
                            <input className="form-input" required value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Laptop Gaming Asus ROG" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Hãng</label>
                                <input className="form-input" required value={newProduct.brand} onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })} placeholder="Asus" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Danh mục</label>
                                <select className="form-input" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                                    <option value="Laptop">Laptop</option>
                                    <option value="Phone">Phone</option>
                                    <option value="Phụ kiện">Phụ kiện</option>
                                    <option value="Monitor">Monitor</option>
                                    <option value="PC">PC</option>
                                    <option value="VGA">VGA</option>
                                    <option value="CPU">CPU</option>
                                    <option value="Printer">Printer</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Giá bán (VND)</label>
                                <input className="form-input" type="number" required value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="25000000" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tồn kho ban đầu</label>
                                <input className="form-input" type="number" required value={newProduct.stock_quantity} onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })} placeholder="20" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Bảo hành (tháng)</label>
                            <input className="form-input" type="number" required value={newProduct.warranty_period} onChange={(e) => setNewProduct({ ...newProduct, warranty_period: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mô tả chi tiết</label>
                            <textarea className="form-input" rows="2" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Cấu hình, thông số chi tiết..." />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyCenter: 'flex-end', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="button" className="btn btn-outline" onClick={() => setShowAddProductModal(false)}>Hủy</button>
                            <button type="submit" className="btn btn-primary">💾 Lưu sản phẩm</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* RESTOCK INVENTORY MODAL */}
            <div className={`modal-overlay ${showImportModal ? 'open' : ''}`} onClick={(e) => e.target.className.includes('modal-overlay') && setShowImportModal(false)}>
                <div className="modal">
                    <div className="modal-header">
                        <h3 className="modal-title">🏭 Nhập hàng vào kho</h3>
                        <button className="modal-close" onClick={() => setShowImportModal(false)}>✕</button>
                    </div>
                    <form onSubmit={handleRestock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="form-group">
                            <label className="form-label">Sản phẩm cần nhập</label>
                            <select className="form-input" value={importForm.product_id} onChange={(e) => setImportForm({ ...importForm, product_id: e.target.value })}>
                                {products.map(p => (
                                    <option key={p.product_id} value={p.product_id}>{p.name} (Tồn: {p.stock_quantity})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Nhà cung cấp</label>
                                <select className="form-input" value={importForm.supplier_id} onChange={(e) => setImportForm({ ...importForm, supplier_id: e.target.value })}>
                                    {suppliers.map(s => (
                                        <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Số lượng nhập</label>
                                <input className="form-input" type="number" required value={importForm.quantity} onChange={(e) => setImportForm({ ...importForm, quantity: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-outline" onClick={() => setShowImportModal(false)}>Hủy</button>
                            <button type="submit" className="btn btn-primary">📥 Xác nhận nhập kho</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ORDER DETAIL SIDE PANEL */}
            <div className={`side-panel ${showSidePanel ? 'open' : ''}`}>
                <div className="side-panel-header">
                    <div className="card-title" style={{ fontSize: '15px', fontWeight: '700' }}>Chi tiết đơn hàng #{selectedOrder?.id}</div>
                    <button onClick={() => setShowSidePanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-2)' }}>✕</button>
                </div>
                {selectedOrder && (
                    <div className="side-panel-body">
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700' }}>Thông tin đơn hàng</div>
                            <div className="detail-row"><span className="detail-label">Người mua</span><span>{selectedOrder.user || 'Khách hàng'}</span></div>
                            <div className="detail-row"><span className="detail-label">Ngày đặt</span><span>{new Date(selectedOrder.date).toLocaleString('vi-VN')}</span></div>
                            <div className="detail-row"><span className="detail-label">Địa chỉ nhận</span><span style={{ fontSize: '12px' }}>{selectedOrder.receiver_address}</span></div>
                            <div className="detail-row"><span className="detail-label">Số điện thoại</span><span>{selectedOrder.receiver_phone}</span></div>
                            <div className="detail-row"><span className="detail-label">Vận chuyển</span><span>{selectedOrder.shipper || 'Chờ chỉ định'}</span></div>
                            <div className="detail-row">
                                <span className="detail-label">Trạng thái giao</span>
                                <span className={`badge ${{ Pending: 'badge-yellow', Shipping: 'badge-blue', Delivered: 'badge-green', Cancelled: 'badge-red' }[selectedOrder.status] || 'badge-gray'}`}>
                                    {selectedOrder.status}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Trạng thái thanh toán</span>
                                <span className={`badge ${selectedOrder.payment === 'Completed' ? 'badge-green' : selectedOrder.payment === 'Refunded' ? 'badge-purple' : 'badge-yellow'}`}>
                                    {selectedOrder.payment}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700' }}>Danh sách sản phẩm mua</div>
                            {selectedOrder.items?.map((item, idx) => (
                                <div key={idx} className="detail-row" style={{ fontSize: '12.5px' }}>
                                    <span>{item.name} <b>x{item.quantity}</b></span>
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {selectedOrder.status === 'Pending' && (
                                <>
                                    <button className="btn btn-primary" onClick={() => handleUpdateStatus(selectedOrder.id, 'Shipping')}>
                                        ✅ Xác nhận & Giao hàng (Shipping)
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelled')}>
                                        ❌ Hủy bỏ đơn hàng này (Cancelled)
                                    </button>
                                </>
                            )}
                            {selectedOrder.status === 'Shipping' && (
                                <button className="btn btn-success" style={{ border: '1px solid #a7f3d0' }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')}>
                                    🎉 Đánh dấu đã giao thành công (Delivered)
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* TOAST SYSTEM */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.type}`}>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;