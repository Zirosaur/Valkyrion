import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-discord-tertiary flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-discord-blurple mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-discord-muted mb-6">The page you are looking for is not available</p>
        <Link href="/">
          <button className="bg-discord-blurple hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium transition-colors">
            Return to Homepage
          </button>
        </Link>
      </div>
    </div>
  );
}