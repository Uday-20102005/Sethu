import { useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "../../api/auth";
import { useToast } from "../../context/ToastContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email"); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-50 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
            <Leaf size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-slate-800">RaithuSethu</span>
        </div>

        {!sent ? (
          <div className="card p-8">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-6">
              <Mail size={24} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot your password?</h1>
            <p className="text-slate-500 text-sm mb-8">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-9"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1.5">
                <ArrowLeft size={14} /> Back to Sign in
              </Link>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Check your inbox</h2>
            <p className="text-slate-500 text-sm mb-2">
              If an account exists for <span className="font-semibold text-slate-700">{email}</span>, we've sent a password reset link.
            </p>
            <p className="text-slate-400 text-xs mb-8">Didn't receive it? Check your spam folder.</p>
            <Link to="/login" className="btn btn-primary inline-flex">
              Back to Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
