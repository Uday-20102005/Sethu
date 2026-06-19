import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, MessageCircle, User, Package, Clock, Filter } from "lucide-react";
import { farmerApi } from "../../api/farmer";
import { chatApi } from "../../api/resources";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "../../components/ui/Badge";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { format, parseISO } from "date-fns";

export default function PurchaseRequests() {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState("all");
  const toast = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await farmerApi.getPurchaseRequests();
      setRequests(res.data || []);
    } catch { toast.error("Failed to load requests"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setFiltered(filter === "all" ? requests : requests.filter(r => r.status === filter));
  }, [requests, filter]);

  const handleAccept = async (id) => {
    setActionLoading(a => ({ ...a, [id]: "accept" }));
    try {
      await farmerApi.acceptRequest(id);
      toast.success("Request accepted!");
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed to accept"); }
    finally { setActionLoading(a => ({ ...a, [id]: null })); }
  };

  const handleReject = async (id) => {
    setActionLoading(a => ({ ...a, [id]: "reject" }));
    try {
      await farmerApi.rejectRequest(id);
      toast.success("Request rejected");
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed to reject"); }
    finally { setActionLoading(a => ({ ...a, [id]: null })); }
  };

  const handleChat = async (buyerId) => {
    try {
      const res = await chatApi.createConversation(buyerId);
      navigate("/chat", { state: { conversationId: res.data?.id } });
    } catch { toast.error("Could not start chat"); }
  };

  const tabs = [
    { key: "all", label: "All", count: requests.length },
    { key: "pending", label: "Pending", count: requests.filter(r=>r.status==="pending").length },
    { key: "accepted", label: "Accepted", count: requests.filter(r=>r.status==="accepted").length },
    { key: "rejected", label: "Rejected", count: requests.filter(r=>r.status==="rejected").length },
  ];

  return (
    <div className="page-enter space-y-6">
      <div className="page-header">
        <h1 className="page-title">Purchase Requests</h1>
        <p className="page-subtitle">Review and respond to buyer purchase requests for your crops</p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tabs.map(({ key, label, count }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${filter === key ? "border-green-500 bg-green-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <p className={`text-2xl font-bold ${filter === key ? "text-green-700" : "text-slate-800"}`}>{count}</p>
              <p className={`text-sm mt-0.5 ${filter === key ? "text-green-600" : "text-slate-500"}`}>{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            type="requests"
            title={filter !== "all" ? `No ${filter} requests` : "No purchase requests yet"}
            description={filter !== "all" ? `Switch to 'All' to see all requests` : "When buyers request your crops, they'll appear here."}
          />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Buyer</th>
                <th className="text-left px-4 py-3 font-semibold">Crop</th>
                <th className="text-left px-4 py-3 font-semibold">Quantity</th>
                <th className="text-left px-4 py-3 font-semibold">Proposed Price</th>
                <th className="text-left px-4 py-3 font-semibold">Message</th>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((req, i) => (
                <tr key={req.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User size={14} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{req["users!buyer_id"]?.name || req.buyer_name || "Buyer"}</p>
                        <p className="text-xs text-slate-400">{req["users!buyer_id"]?.phone || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-800">{req.crop_name || req.crops?.name || "—"}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{req.quantity} units</td>
                  <td className="px-4 py-4 font-semibold text-slate-800">
                    {req.proposed_price ? `₹${req.proposed_price}` : <span className="text-slate-400 font-normal text-xs">Not specified</span>}
                  </td>
                  <td className="px-4 py-4 max-w-48">
                    <p className="text-slate-600 text-xs truncate" title={req.message}>{req.message || "—"}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {req.created_at ? format(parseISO(req.created_at), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={req.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1.5">
                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAccept(req.id)}
                            disabled={actionLoading[req.id]}
                            className="btn btn-primary btn-sm"
                          >
                            {actionLoading[req.id] === "accept" ? "..." : <><CheckCircle2 size={12} /> Accept</>}
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={actionLoading[req.id]}
                            className="btn btn-danger btn-sm"
                          >
                            {actionLoading[req.id] === "reject" ? "..." : <><XCircle size={12} /> Reject</>}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleChat(req["users!buyer_id"]?.id || req.buyer_id)}
                        className="btn btn-secondary btn-sm btn-icon"
                        title="Chat with buyer"
                      >
                        <MessageCircle size={13} />
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
  );
}
