import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist.
          </p>
          <Link
            href="/"
            className="inline-block bg-black text-white px-6 py-3 rounded font-semibold hover:bg-gray-800 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

