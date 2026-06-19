import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Package, Calendar, MapPin, CreditCard } from "lucide-react";
import { bookingsApi } from "../../api/resources";
import { useToast } from "../../context/ToastContext";
import { StatusBadge } from "../../components/ui/Badge";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { format, parseISO } from "date-fns";

export default function FarmerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState({});
  const [filter, setFilter] = useState("all");
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.getAll();
      setBookings(res.data || []);
    } catch { toast.error("Failed to load bookings"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleComplete = async (id) => {
    setCompleting(c => ({ ...c, [id]: true }));
    try {
      await bookingsApi.complete(id);
      toast.success("Booking marked as completed!");
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed to complete booking"); }
    finally { setCompleting(c => ({ ...c, [id]: false })); }
  };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const tabs = [
    { key: "all", label: "All" },
    { key: "confirmed", label: "Confirmed" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="page-enter space-y-6">
      <div className="page-header">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">Track orders and mark deliveries as complete</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            type="requests"
            title={filter !== "all" ? `No ${filter} bookings` : "No bookings yet"}
            description="Bookings from buyers will appear here when they book your crops."
          />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Crop</th>
                <th className="text-left px-4 py-3 font-semibold">Quantity</th>
                <th className="text-left px-4 py-3 font-semibold">Total Price</th>
                <th className="text-left px-4 py-3 font-semibold">Payment</th>
                <th className="text-left px-4 py-3 font-semibold">Delivery</th>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((booking, i) => (
                <tr key={booking.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <Package size={14} className="text-green-600" />
                      </div>
                      <p className="font-semibold text-slate-800">{booking.crops?.name || "Crop"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{booking.quantity} {booking.crops?.unit || "units"}</td>
                  <td className="px-4 py-4 font-bold text-green-700">₹{booking.total_price?.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                      <CreditCard size={12} className="text-slate-400" />
                      {booking.payment_method || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500 text-xs max-w-36 truncate" title={booking.delivery_address}>
                    {booking.delivery_address || "—"}
                  </td>
                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {booking.delivery_date ? format(parseISO(booking.delivery_date), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={booking.status} /></td>
                  <td className="px-4 py-4">
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => handleComplete(booking.id)}
                        disabled={completing[booking.id]}
                        className="btn btn-primary btn-sm"
                      >
                        {completing[booking.id] ? "..." : <><CheckCircle2 size={12} /> Complete</>}
                      </button>
                    )}
                    {booking.status === "completed" && (
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Done
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
