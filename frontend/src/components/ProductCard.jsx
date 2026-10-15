import 'react'; // Đã sửa: import đúng cú pháp React
import cartService from '../services/cartService';
import authService from '../services/authService';
import { Link } from 'react-router-dom';
import { getProductImage } from '../utils/imageHelper';

const ProductCard = ({ product }) => {
    const handleAddToCart = async () => {
        const user = authService.getCurrentUser();
        if (!user) {
            alert('Vui lòng đăng nhập để thêm vào giỏ hàng!');
            return;
        }

        try {
            await cartService.addToCart(user.account_id, product.product_id, 1);
            alert(`Đã thêm ${product.name} vào giỏ!`);
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white flex flex-col h-full">
            {/* Bọc ảnh trong Link để điều hướng tới trang chi tiết */}
            <Link to={`/product/${product.product_id}`}>
                <img 
                    src={getProductImage(product)} 
                    alt={product.name} 
                    className="w-full h-48 object-cover mb-4 rounded hover:opacity-90 transition-opacity" 
                />
            </Link>

            <div className="flex-grow">
                {/* Bọc tên trong Link để điều hướng */}
                <Link to={`/product/${product.product_id}`} className="hover:text-blue-600 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
                </Link>
                <p className="text-gray-500 text-sm mt-1">{product.category}</p>
            </div>

            <div className="mt-4">
                <p className="text-xl font-bold text-red-600 mb-3">
                    {Number(product.price).toLocaleString('vi-VN')} ₫
                </p>
                <button 
                    onClick={handleAddToCart}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                    Thêm vào giỏ
                </button>
            </div>
        </div>
    );
};

export default ProductCard;