import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Không tìm thấy trang bạn yêu cầu.</p>
      <Link to="/dashboard" className="btn btn-primary">
        Về Dashboard
      </Link>
    </div>
  );
}
