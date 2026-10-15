import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await authService.login(credentials);
            alert('Đăng nhập thành công!');
            window.location.href = '/'; 
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi kết nối đến server');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 56px)', padding: '20px' }}>
            <div className="card" style={{ padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'left' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', textAlign: 'center', marginBottom: '24px' }}>Đăng nhập TechShop</h2>
                
                {error && (
                    <div className="badge badge-red" style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '16px', display: 'block', boxSizing: 'border-box' }}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Tên đăng nhập</label>
                        <input 
                            type="text" 
                            name="username" 
                            value={credentials.username} 
                            onChange={handleChange} 
                            className="form-input"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mật khẩu</label>
                        <input 
                            type="password" 
                            name="password" 
                            value={credentials.password} 
                            onChange={handleChange} 
                            className="form-input"
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: '600', marginTop: '8px' }}>
                        Đăng nhập
                    </button>
                </form>
                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-2)' }}>
                    Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;