import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import cartService from '../services/cartService';
import authService from '../services/authService';
import { getProductImage } from '../utils/imageHelper';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const catMap = {
        'all': '',
        'Laptop': 'Laptop',
        'Điện thoại': 'Phone',
        'Phụ kiện': 'Phụ kiện',
        'Màn hình': 'Monitor',
        'Chuột & Bàn phím': 'Phụ kiện'
    };

    useEffect(() => {
        setUser(authService.getCurrentUser());
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = {
                    keyword: search
                };
                const dbCat = catMap[activeCategory];
                if (dbCat) {
                    params.category = dbCat;
                }
                const data = await productService.searchProducts(params);
                setProducts(data);
            } catch (error) {
                console.error("Error loading products:", error);
            } finally {
                setLoading(false);
            }
        };

        const delayDebounce = setTimeout(() => {
            fetchProducts();
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [search, activeCategory]);

    const handleAddToCart = async (e, product) => {
        e.stopPropagation();
        if (!user) {
            alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
            navigate('/login');
            return;
        }
        try {
            await cartService.addToCart(user.account_id, product.product_id, 1);
            window.dispatchEvent(new Event('cart-updated'));
            alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
        } catch (error) {
            alert('Lỗi thêm vào giỏ hàng: ' + (error.response?.data?.error || error.message));
        }
    };



    const fmtPrice = (n) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(n);
    };

    const sortedProducts = [...products];
    if (sort === 'price-asc') {
        sortedProducts.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'price-desc') {
        sortedProducts.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === 'rating') {
        sortedProducts.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return (
        <div id="store-home">
            <div className="hero">
                <h2>Công nghệ đỉnh cao,<br />Giá <span>không thể tin</span></h2>
                <p>Laptop, điện thoại, phụ kiện chính hãng – giao hàng toàn quốc</p>
                <button className="hero-btn" onClick={() => {
                    const el = document.getElementById('products-section-title');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}>Mua sắm ngay →</button>
            </div>
            
            <div className="filter-bar">
                <button className={`filter-chip ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>Tất cả</button>
                <button className={`filter-chip ${activeCategory === 'Laptop' ? 'active' : ''}`} onClick={() => setActiveCategory('Laptop')}>💻 Laptop</button>
                <button className={`filter-chip ${activeCategory === 'Điện thoại' ? 'active' : ''}`} onClick={() => setActiveCategory('Điện thoại')}>📱 Điện thoại</button>
                <button className={`filter-chip ${activeCategory === 'Phụ kiện' ? 'active' : ''}`} onClick={() => setActiveCategory('Phụ kiện')}>🎧 Phụ kiện</button>
                <button className={`filter-chip ${activeCategory === 'Màn hình' ? 'active' : ''}`} onClick={() => setActiveCategory('Màn hình')}>🖥️ Màn hình</button>
                <button className={`filter-chip ${activeCategory === 'Chuột & Bàn phím' ? 'active' : ''}`} onClick={() => setActiveCategory('Chuột & Bàn phím')}>⌨️ Chuột & Bàn phím</button>
            </div>

            <div id="products-section-title" style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Danh sách sản phẩm</h2>
                <input 
                    className="input" 
                    placeholder="🔍 Tìm kiếm sản phẩm..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    style={{ maxWidth: '300px', flex: 1 }}
                />
                <select 
                    className="input" 
                    value={sort} 
                    onChange={(e) => setSort(e.target.value)} 
                    style={{ maxWidth: '180px' }}
                >
                    <option value="">Sắp xếp</option>
                    <option value="price-asc">Giá tăng dần</option>
                    <option value="price-desc">Giá giảm dần</option>
                    <option value="rating">Đánh giá cao</option>
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>Đang tải sản phẩm...</div>
            ) : sortedProducts.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🔍</div>
                    <p>Không tìm thấy sản phẩm nào phù hợp.</p>
                </div>
            ) : (
                <div className="products-grid">
                    {sortedProducts.map(p => {
                        const discount = p.price < 15000000 && p.category === 'Laptop' ? 10 : 0;
                        const oldPrice = discount ? p.price * 1.15 : null;

                        return (
                            <div key={p.product_id} className="product-card" onClick={() => navigate(`/product/${p.product_id}`)}>
                                <div className="product-img" style={{ overflow: 'hidden', padding: 0 }}>
                                    {discount > 0 && <div className="product-tag">-{discount}%</div>}
                                    {Number(p.stock_quantity) === 0 && <div className="product-tag" style={{ background: '#6b7280' }}>Hết hàng</div>}
                                    <img 
                                        src={getProductImage(p)} 
                                        alt={p.name} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                </div>
                                <div className="product-info">
                                    <div>
                                        <div className="product-brand">{p.brand}</div>
                                        <div className="product-name">{p.name}</div>
                                    </div>
                                    <div style={{ marginTop: '8px' }}>
                                        <div>
                                            <span className="product-price">{fmtPrice(p.price)}</span>
                                            {oldPrice && <span className="product-old-price">{fmtPrice(oldPrice)}</span>}
                                        </div>
                                        <div className="product-rating">
                                            <span className="stars">{'★'.repeat(Math.round(p.rating || 4)) + '☆'.repeat(5 - Math.round(p.rating || 4))}</span>
                                            <span>{p.rating ? Number(p.rating).toFixed(1) : '4.0'} ({p.reviews || 0})</span>
                                            {Number(p.stock_quantity) > 0 && (
                                                <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: '11px' }}>
                                                    Còn {p.stock_quantity}
                                                </span>
                                            )}
                                        </div>
                                        <button 
                                            className="add-cart-btn" 
                                            onClick={(e) => handleAddToCart(e, p)}
                                            disabled={Number(p.stock_quantity) === 0}
                                            style={Number(p.stock_quantity) === 0 ? { background: '#9ca3af', cursor: 'not-allowed' } : {}}
                                        >
                                            {Number(p.stock_quantity) === 0 ? 'Hết hàng' : '🛒 Thêm vào giỏ'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Home;