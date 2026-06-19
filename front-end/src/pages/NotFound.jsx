import { Link } from "react-router-dom";
import { Leaf, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg mb-8">
        <Leaf size={32} className="text-white" />
      </div>
      <h1 className="text-8xl font-bold text-slate-200 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
      <p className="text-slate-500 mb-8 max-w-sm mx-auto">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary inline-flex">
        <ArrowLeft size={16} /> Back to Home
      </Link>
    </div>
  );
}
