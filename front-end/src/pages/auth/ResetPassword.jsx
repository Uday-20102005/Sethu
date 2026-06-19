import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Leaf, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";
import { authApi } from "../../api/auth";
import { useToast } from "../../context/ToastContext";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid or expired reset link.");
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-green-500"][strength];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-50 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
            <Leaf size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-slate-800">RaithuSethu</span>
        </div>

        {!done ? (
          <div className="card p-8">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-6">
              <ShieldCheck size={24} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Set new password</h1>
            <p className="text-slate-500 text-sm mb-8">Choose a strong password to protect your account.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="input-field pl-9 pr-10"
                    required minLength={6}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3].map(s => (
                        <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= strength ? strengthColor : "bg-slate-200"}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${strength === 1 ? "text-red-500" : strength === 2 ? "text-amber-500" : "text-green-600"}`}>{strengthLabel} password</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    className={`input-field pl-9 ${confirm && confirm !== password ? "border-red-400" : ""}`}
                    required
                  />
                </div>
                {confirm && confirm !== password && <p className="text-xs text-red-500 mt-1">Passwords don't match</p>}
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg mt-2">
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700">Back to Sign in</Link>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Password updated!</h2>
            <p className="text-slate-500 text-sm mb-8">Your password has been changed successfully. Redirecting you to sign in...</p>
            <Link to="/login" className="btn btn-primary inline-flex">Go to Sign in</Link>
          </div>
        )}
      </div>
    </div>
  );
}
