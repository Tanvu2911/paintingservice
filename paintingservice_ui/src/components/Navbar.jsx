import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <nav style={{ background: '#1a365d', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {/* Click vào logo sẽ về trang chủ */}
      <h1 style={{ margin: 0, fontSize: '20px', cursor: 'pointer' }} onClick={() => navigate('/')}>
        ⚙️ SuaChua247
      </h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Kiểm tra nếu ĐÃ ĐĂNG NHẬP (user khác null) */}
        {user ? (
          <>
            <span>Xin chào, <strong>{user.username}</strong> ({user.role})</span>
            <div style={{ display: 'flex', gap: '15px' }}>
              {(user.role === 'ROLE_CUSTOMER' || user.role === 'ROLE_ADMIN' || !user.role) && <Link to="/home" style={{ color: '#fff', textDecoration: 'none' }}>Trang Chủ</Link>}
              {user.role === 'ROLE_STAFF' && <Link to="/employee" style={{ color: '#fff', textDecoration: 'none' }}>Nhiệm Vụ</Link>}
              {user.role === 'ROLE_ADMIN' && <Link to="/admin" style={{ color: '#fff', textDecoration: 'none' }}>Quản Trị</Link>}
            </div>
            <button onClick={onLogout} style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
              Đăng xuất
            </button>
          </>
        ) : (
          /* Nếu CHƯA ĐĂNG NHẬP (user là null) -> Hiện nút điều hướng sang trang Login/Register */
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', background: '#3182ce', padding: '8px 16px', borderRadius: '4px' }}>
              Đăng Nhập
            </Link>
            <Link to="/register" style={{ color: '#1a365d', textDecoration: 'none', fontWeight: 'bold', background: '#fff', padding: '8px 16px', borderRadius: '4px' }}>
              Đăng Ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;