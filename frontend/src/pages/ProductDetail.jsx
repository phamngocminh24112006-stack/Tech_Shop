import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import cartService from '../services/cartService';
import authService from '../services/authService';
import { getProductReviews, submitReview } from '../services/reviewService';
import { getProductImage } from '../utils/imageHelper';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Review form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    const fetchProductAndReviews = async () => {
        try {
            const [productData, reviewsData] = await Promise.all([
                productService.getProductById(id),
                getProductReviews(id)
            ]);
            setProduct(productData);
            setReviews(reviewsData);
        } catch (err) {
            console.error("Lỗi tải sản phẩm và đánh giá:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setUser(authService.getCurrentUser());
        fetchProductAndReviews();
    }, [id]);

    const handleAddToCart = async () => {
        if (!user) {
            alert('Vui lòng đăng nhập để mua hàng!');
            navigate('/login');
            return;
        }
        try {
            await cartService.addToCart(user.account_id, product.product_id, quantity);
            window.dispatchEvent(new Event('cart-updated'));
            alert('Đã thêm vào giỏ hàng thành công!');
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.error || error.response?.data?.message || error.message));
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Vui lòng đăng nhập để gửi đánh giá!');
            navigate('/login');
            return;
        }
        setSubmitLoading(true);
        try {
            await submitReview({
                product_id: parseInt(id),
                rating: parseFloat(rating),
                comment: comment
            });
            alert('Gửi đánh giá thành công!');
            setComment('');
            // Reload reviews
            const reviewsData = await getProductReviews(id);
            setReviews(reviewsData);
        } catch (error) {
            alert('Lỗi gửi đánh giá: ' + (error.response?.data?.error || error.response?.data?.message || error.message));
        } finally {
            setSubmitLoading(false);
        }
    };



    const fmtPrice = (n) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(n);
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Đang tải chi tiết sản phẩm...</div>;
    if (!product) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--danger)' }}>Sản phẩm không tồn tại.</div>;

    return (
        <div className="cart-section" style={{ maxWidth: '900px' }}>
            <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '24px' }}>
                {/* Product Image Panel */}
                <div style={{ background: '#f0f4ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', overflow: 'hidden' }}>
                    <img 
                        src={getProductImage(product)} 
                        alt={product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '300px' }} 
                    />
                </div>

                {/* Details Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
                    <div>
                        <div className="product-brand" style={{ fontSize: '12px', color: 'var(--text-3)' }}>{product.brand}</div>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '4px 0 12px', color: 'var(--text)' }}>{product.name}</h1>
                        <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--primary)', marginBottom: '16px' }}>{fmtPrice(product.price)}</div>
                        
                        <div className="detail-row"><span className="detail-label">Danh mục</span><span>{product.category}</span></div>
                        <div className="detail-row"><span className="detail-label">Bảo hành</span><span>{product.warranty_period} tháng</span></div>
                        <div className="detail-row"><span className="detail-label">Tồn kho</span>
                            <span style={{ fontWeight: '600', color: product.stock_quantity > 0 ? 'var(--accent)' : 'var(--danger)' }}>
                                {product.stock_quantity > 0 ? `Còn ${product.stock_quantity} sản phẩm` : 'Hết hàng'}
                            </span>
                        </div>
                        
                        <p style={{ marginTop: '16px', color: 'var(--text-2)', fontSize: '13.5px', lineHeight: '1.6' }}>
                            {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                        </p>
                    </div>

                    <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', gap: '12px' }}>
                        <div className="qty-control">
                            <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                            <span style={{ fontWeight: '600', minWidth: '24px', textAlign: 'center' }}>{quantity}</span>
                            <button className="qty-btn" onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}>+</button>
                        </div>
                        <button 
                            className="btn btn-primary" 
                            style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600' }}
                            onClick={handleAddToCart}
                            disabled={product.stock_quantity <= 0}
                        >
                            {product.stock_quantity > 0 ? '🛒 Thêm vào giỏ hàng' : 'Hết hàng'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginTop: '24px' }}>
                {/* List Reviews */}
                <div className="card" style={{ padding: '20px', textAlign: 'left' }}>
                    <h3 className="card-title" style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        ⭐ Đánh giá từ khách hàng ({reviews.length})
                    </h3>
                    {reviews.length === 0 ? (
                        <p style={{ color: 'var(--text-3)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Sản phẩm này chưa có đánh giá nào.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {reviews.map((rev, idx) => (
                                <div key={idx} style={{ paddingBottom: '12px', borderBottom: idx < reviews.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px' }}>👤 {rev.reviewer_name || rev.username}</span>
                                        <span className="stars">{'★'.repeat(Math.round(rev.rating)) + '☆'.repeat(5 - Math.round(rev.rating))}</span>
                                    </div>
                                    <p style={{ color: 'var(--text-2)', fontSize: '13px', lineHeight: '1.5' }}>{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Review Form */}
                <div className="card" style={{ padding: '20px', height: 'fit-content' }}>
                    <h3 className="card-title" style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', textAlign: 'left' }}>
                        ✍️ Viết đánh giá
                    </h3>
                    <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="form-group">
                            <label className="form-label">Điểm đánh giá (Sao)</label>
                            <select 
                                className="form-input" 
                                value={rating} 
                                onChange={(e) => setRating(Number(e.target.value))}
                            >
                                <option value="5">⭐⭐⭐⭐⭐ (5 Sao)</option>
                                <option value="4">⭐⭐⭐⭐ (4 Sao)</option>
                                <option value="3">⭐⭐⭐ (3 Sao)</option>
                                <option value="2">⭐⭐ (2 Sao)</option>
                                <option value="1">⭐ (1 Sao)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nhận xét của bạn</label>
                            <textarea 
                                className="form-input" 
                                rows="3" 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Hãy chia sẻ cảm nhận về sản phẩm..."
                                style={{ resize: 'vertical' }}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={submitLoading} 
                            className="btn btn-primary"
                            style={{ padding: '8px', width: '100%', fontWeight: '600' }}
                        >
                            {submitLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;