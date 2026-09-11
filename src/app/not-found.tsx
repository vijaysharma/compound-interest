import Link from '@/navigation';
export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#1d4ed8' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Page Not Found</h2>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          backgroundColor: '#2563eb',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Return to Home
      </Link>
    </div>
  );
}
