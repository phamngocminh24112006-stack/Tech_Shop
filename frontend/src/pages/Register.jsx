import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const Register = () => {
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '', address: '', username: '', password: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await authService.register(formData);
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Lỗi hệ thống');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 56px)', padding: '40px 20px' }}>
            <div className="card" style={{ padding: '32px', width: '100%', maxWidth: '480px', textAlign: 'left' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', textAlign: 'center', marginBottom: '24px' }}>Đăng ký Tài khoản</h2>
                
                {error && (
                    <div className="badge badge-red" style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '16px', display: 'block', boxSizing: 'border-box' }}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Họ và tên</label>
                        <input type="text" name="full_name" className="form-input" onChange={handleChange} required placeholder="Nguyễn Văn A" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" name="email" className="form-input" onChange={handleChange} required placeholder="email@gmail.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Số điện thoại</label>
                            <input type="text" name="phone" className="form-input" onChange={handleChange} placeholder="0901234567" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Địa chỉ mặc định</label>
                        <input type="text" name="address" className="form-input" onChange={handleChange} placeholder="123 Đường Láng, Hà Nội" />
                    </div>
                    <div className="form-row" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                        <div className="form-group">
                            <label className="form-label">Tên đăng nhập</label>
                            <input type="text" name="username" className="form-input" onChange={handleChange} required placeholder="user123" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mật khẩu</label>
                            <input type="password" name="password" className="form-input" onChange={handleChange} required placeholder="******" />
                        </div>
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: '600', marginTop: '12px' }}>
                        Đăng ký tài khoản
                    </button>
                </form>
                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-2)' }}>
                    Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;