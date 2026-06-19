import { useEffect, useState } from "react";
import { Package, MapPin, CreditCard, Calendar, Truck, CheckCircle2 } from "lucide-react";
import { bookingsApi } from "../../api/resources";
import { useToast } from "../../context/ToastContext";
import { StatusBadge } from "../../components/ui/Badge";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { format, parseISO } from "date-fns";

export default function BuyerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
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
        <p className="page-subtitle">Track your purchased crops and delivery status</p>
      </div>

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
            description="Bookings will appear here after you book an accepted purchase request."
          />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Crop & Farmer</th>
                <th className="text-left px-4 py-3 font-semibold">Quantity</th>
                <th className="text-left px-4 py-3 font-semibold">Total Paid</th>
                <th className="text-left px-4 py-3 font-semibold">Payment Method</th>
                <th className="text-left px-4 py-3 font-semibold">Delivery To</th>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((booking, i) => (
                <tr key={booking.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Package size={15} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{booking.crops?.name || "Crop"}</p>
                        <p className="text-xs text-slate-500">From: Farmer #{booking.crops?.farmer_id || "Unknown"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-medium">{booking.quantity} {booking.crops?.unit || "units"}</td>
                  <td className="px-4 py-4 font-bold text-slate-900">₹{booking.total_price?.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs uppercase font-semibold">
                      <CreditCard size={13} className="text-slate-400" />
                      {booking.payment_method}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-xs max-w-48">
                    <div className="flex items-start gap-1.5">
                      <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2" title={booking.delivery_address}>{booking.delivery_address}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {booking.created_at ? format(parseISO(booking.created_at), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-4">
                    {booking.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={12} /> Delivered
                      </span>
                    ) : (
                      <StatusBadge status={booking.status} />
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
