import { useEffect, useState } from "react";
import { Users, Sprout, ShoppingBag, ShieldCheck, CheckCircle2, XCircle, UserX, UserCheck } from "lucide-react";
import { adminApi } from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import StatCard from "../../components/ui/StatCard";
import { SkeletonStatCards, SkeletonTable } from "../../components/ui/Skeleton";
import { format, parseISO } from "date-fns";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, farmersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getFarmers(),
      ]);
      setStats(statsRes.data);
      // Filter for unverified farmers
      setPendingFarmers((farmersRes.data || []).filter(f => !f.is_verified));
    } catch { toast.error("Failed to load admin dashboard"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (id, isVerify) => {
    setActionLoading(a => ({ ...a, [id]: true }));
    try {
      if (isVerify) {
        await adminApi.verifyUser(id);
        toast.success("Farmer verified successfully!");
      } else {
        await adminApi.suspendUser(id);
        toast.success("Farmer suspended.");
      }
      load();
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(a => ({ ...a, [id]: false })); }
  };

  return (
    <div className="page-enter space-y-6">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and pending verifications</p>
      </div>

      {loading && !stats ? (
        <SkeletonStatCards count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Farmers" value={stats?.total_farmers || 0} icon={Sprout} iconBg="bg-green-50" iconColor="text-green-600" delay={0} />
          <StatCard title="Total Buyers" value={stats?.total_buyers || 0} icon={ShoppingBag} iconBg="bg-blue-50" iconColor="text-blue-600" delay={80} />
          <StatCard title="Pending Verifications" value={stats?.unverified_farmers || pendingFarmers.length} icon={ShieldCheck} iconBg="bg-amber-50" iconColor="text-amber-600" delay={160} />
          <StatCard title="Platform Transactions" value={stats?.total_orders || 0} icon={CheckCircle2} iconBg="bg-purple-50" iconColor="text-purple-600" delay={240} />
        </div>
      )}

      <div className="card overflow-hidden mt-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900">Pending Farmer Verifications</h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingFarmers.length}</span>
          </div>
        </div>
        
        {loading ? (
          <SkeletonTable rows={4} />
        ) : pendingFarmers.length === 0 ? (
          <div className="p-10 text-center">
            <ShieldCheck size={32} className="text-green-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">All farmers are verified!</p>
            <p className="text-xs text-slate-400 mt-1">No pending verifications at the moment.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr className="text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Farmer</th>
                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold">Location</th>
                  <th className="text-left px-4 py-3 font-semibold">Farm Size</th>
                  <th className="text-left px-4 py-3 font-semibold">Registered</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingFarmers.map(farmer => (
                  <tr key={farmer.id} className="table-row">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                          <UserX size={14} className="text-amber-500" />
                        </div>
                        <p className="font-semibold text-slate-800">{farmer.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-slate-700">{farmer.email}</p>
                      <p className="text-xs text-slate-500">{farmer.phone}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{farmer.location || "—"}</td>
                    <td className="px-4 py-4 text-slate-600">{farmer.farm_size ? `${farmer.farm_size} acres` : "—"}</td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {farmer.created_at ? format(parseISO(farmer.created_at), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerify(farmer.id, true)}
                          disabled={actionLoading[farmer.id]}
                          className="btn btn-primary btn-sm"
                        >
                          <UserCheck size={14} /> Verify
                        </button>
                        <button
                          onClick={() => handleVerify(farmer.id, false)}
                          disabled={actionLoading[farmer.id]}
                          className="btn btn-danger btn-sm btn-icon"
                          title="Reject/Suspend"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
