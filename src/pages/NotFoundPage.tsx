import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center py-24 px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-6xl font-extrabold mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-6">Sorry, the page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Go to Home
        </Link>
      </div>
    </div>
  );
}
