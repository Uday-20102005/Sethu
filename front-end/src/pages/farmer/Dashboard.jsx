import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sprout, ShoppingBag, Clock, Zap, TrendingUp, ArrowRight, AlertTriangle, CheckCircle2, Package } from "lucide-react";
import { farmerApi } from "../../api/farmer";
import { bookingsApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import StatCard from "../../components/ui/StatCard";
import { StatusBadge, CategoryBadge } from "../../components/ui/Badge";
import { SkeletonStatCards } from "../../components/ui/Skeleton";
import { format, parseISO, isPast, differenceInDays } from "date-fns";

function ExpiryRow({ crop }) {
  const daysLeft = crop.expiry_date ? differenceInDays(parseISO(crop.expiry_date), new Date()) : null;
  const isUrgent = daysLeft !== null && daysLeft <= 3;
  return (
    <div className={`flex items-center justify-between py-3 px-4 rounded-xl mb-2 last:mb-0 transition-colors ${isUrgent ? "bg-red-50 border border-red-100" : "bg-slate-50"}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUrgent ? "bg-red-100" : "bg-green-100"}`}>
          <Sprout size={14} className={isUrgent ? "text-red-600" : "text-green-600"} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{crop.name}</p>
          <p className="text-xs text-slate-500">{crop.quantity} {crop.unit}</p>
        </div>
      </div>
      <div className="text-right">
        {daysLeft !== null ? (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isUrgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
            {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
          </span>
        ) : (
          <span className="text-xs text-slate-400">No date</span>
        )}
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [crops, setCrops] = useState([]);
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      farmerApi.getMyCrops(),
      farmerApi.getPurchaseRequests(),
      bookingsApi.getAll(),
    ]).then(([cropsRes, reqRes, bookRes]) => {
      setCrops(cropsRes.data || []);
      setRequests(reqRes.data || []);
      setBookings(bookRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeCrops = crops.filter(c => c.status === "active").length;
  const pendingReqs = requests.filter(r => r.status === "pending").length;
  const totalRevenue = bookings.filter(b => b.status === "completed").reduce((s, b) => s + (b.total_price || 0), 0);
  const expiringCrops = crops.filter(c => {
    if (!c.expiry_date) return false;
    const d = differenceInDays(parseISO(c.expiry_date), new Date());
    return d >= 0 && d <= 7;
  }).sort((a, b) => differenceInDays(parseISO(a.expiry_date), new Date()) - differenceInDays(parseISO(b.expiry_date), new Date()));
  const recentCrops = crops.slice(0, 5);
  const recentRequests = requests.slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-slate-500 text-sm">{greeting} 👋</p>
            <h1 className="page-title">{user?.name || "Farmer"}'s Dashboard</h1>
            <p className="page-subtitle">Here's what's happening on your farm today.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/farmer/flash-sales" className="btn btn-amber btn-sm">
              <Zap size={14} /> Flash Sale
            </Link>
            <Link to="/farmer/crops" className="btn btn-primary btn-sm">
              <Sprout size={14} /> Add Crop
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <SkeletonStatCards count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Crops" value={activeCrops} icon={Sprout} iconBg="bg-green-50" iconColor="text-green-600" trendLabel="this month" delay={0} />
          <StatCard title="Pending Requests" value={pendingReqs} icon={ShoppingBag} iconBg="bg-amber-50" iconColor="text-amber-600" trendLabel="awaiting" delay={80} />
          <StatCard title="Total Bookings" value={bookings.length} icon={Package} iconBg="bg-blue-50" iconColor="text-blue-600" trendLabel="all time" delay={160} />
          <StatCard title="Revenue" value={Math.round(totalRevenue)} prefix="₹" icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600" trendLabel="completed" delay={240} />
        </div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Crop Listings */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Crop Listings</h2>
            <Link to="/farmer/crops" className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : recentCrops.length === 0 ? (
            <div className="p-8 text-center">
              <Sprout size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No crops listed yet</p>
              <Link to="/farmer/crops" className="btn btn-primary btn-sm mt-4">Add Your First Crop</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header text-xs text-slate-500 uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-semibold">Crop</th>
                    <th className="text-left px-4 py-3 font-semibold">Qty</th>
                    <th className="text-left px-4 py-3 font-semibold">Price</th>
                    <th className="text-left px-4 py-3 font-semibold">Expiry</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentCrops.map(crop => (
                    <tr key={crop.id} className="table-row">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                            <Sprout size={14} className="text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{crop.name}</p>
                            <CategoryBadge category={crop.category} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{crop.quantity} {crop.unit}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">₹{crop.price_per_unit}/{crop.unit}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {crop.expiry_date ? format(parseISO(crop.expiry_date), "dd MMM yy") : "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={crop.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Expiring Soon */}
          {expiringCrops.length > 0 && (
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                <AlertTriangle size={15} className="text-amber-500" />
                <h2 className="font-bold text-slate-900 text-sm">Expiring Soon</h2>
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{expiringCrops.length}</span>
              </div>
              <div className="p-3">
                {expiringCrops.slice(0, 4).map(c => <ExpiryRow key={c.id} crop={c} />)}
              </div>
            </div>
          )}

          {/* Recent Requests */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">Recent Requests</h2>
              <Link to="/farmer/requests" className="text-xs text-green-600 font-semibold hover:underline">See All</Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
            ) : recentRequests.length === 0 ? (
              <div className="p-5 text-center text-slate-500 text-sm">No requests yet</div>
            ) : (
              <div className="p-3 space-y-2">
                {recentRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{req.crop_name || req.crops?.name || "Crop"}</p>
                      <p className="text-xs text-slate-500">{req.users?.name || "Buyer"} • {req.quantity} units</p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="card p-4">
            <h2 className="font-bold text-slate-900 text-sm mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { to: "/farmer/crops", icon: Sprout, label: "Add New Crop", color: "text-green-600 bg-green-50" },
                { to: "/farmer/requests", icon: ShoppingBag, label: "Review Requests", color: "text-blue-600 bg-blue-50" },
                { to: "/farmer/flash-sales", icon: Zap, label: "Create Flash Sale", color: "text-amber-600 bg-amber-50" },
                { to: "/chat", icon: CheckCircle2, label: "Chat with Buyers", color: "text-purple-600 bg-purple-50" },
              ].map(({ to, icon: Icon, label, color }) => (
                <Link key={to} to={to} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon size={14} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
                  <ArrowRight size={13} className="ml-auto text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
