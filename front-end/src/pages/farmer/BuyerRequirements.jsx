import { useEffect, useState } from "react";
import { ClipboardList, Send, MapPin, Calendar, DollarSign, User, Package, CheckCircle2 } from "lucide-react";
import { farmerApi } from "../../api/farmer";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/ui/Modal";
import { CategoryBadge } from "../../components/ui/Badge";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { format, parseISO } from "date-fns";

export default function BuyerRequirements() {
  const [requirements, setRequirements] = useState([]);
  const [myCrops, setMyCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondModal, setRespondModal] = useState(null);
  const [responseForm, setResponseForm] = useState({ crop_id: "", offered_price: "", message: "" });
  const [responding, setResponding] = useState(false);
  const [respondedIds, setRespondedIds] = useState(new Set());
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [reqRes, cropsRes, myRes] = await Promise.all([
        farmerApi.getBuyerRequirements(),
        farmerApi.getMyCrops(),
        farmerApi.getMyResponses(),
      ]);
      setRequirements(reqRes.data || []);
      setMyCrops((cropsRes.data || []).filter(c => c.status === "active"));
      setRespondedIds(new Set(myRes.data || []));
    } catch { toast.error("Failed to load requirements"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openRespond = (req) => {
    setRespondModal(req);
    setResponseForm({ crop_id: myCrops[0]?.id || "", offered_price: "", message: "" });
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!responseForm.crop_id) { toast.error("Select a crop to offer"); return; }
    if (!responseForm.offered_price || Number(responseForm.offered_price) <= 0) { toast.error("Enter a valid offered price"); return; }
    setResponding(true);
    try {
      await farmerApi.respondToRequirement({
        requirement_id: respondModal.id,
        crop_id: responseForm.crop_id,
        offered_price: Number(responseForm.offered_price),
        message: responseForm.message,
      });
      toast.success("Response sent successfully!");
      setRespondModal(null);
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed to send response"); }
    finally { setResponding(false); }
  };

  return (
    <div className="page-enter space-y-6">
      <div className="page-header">
        <h1 className="page-title">Buyer Requirements</h1>
        <p className="page-subtitle">Browse what buyers need and respond with your available crops</p>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : requirements.length === 0 ? (
        <div className="card">
          <EmptyState
            type="requests"
            title="No buyer requirements posted"
            description="When buyers post requirements, they'll appear here. Check back later."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {requirements.map((req, i) => (
            <div key={req.id} className="card p-5 card-interactive animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{req.crop_name}</h3>
                  <CategoryBadge category={req.category} />
                </div>
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Package size={16} className="text-blue-600" />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Package size={13} className="text-slate-400" />
                  <span><strong>{req.quantity} {req.unit}</strong> required</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign size={13} className="text-slate-400" />
                  <span>Max budget: <strong className="text-green-700">₹{req.max_price}/{req.unit}</strong></span>
                </div>
                {req.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{req.location}</span>
                  </div>
                )}
                {req.required_by && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Needed by: {format(parseISO(req.required_by), "dd MMM yyyy")}</span>
                  </div>
                )}
                {req["users!buyer_id"] && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <User size={13} className="text-slate-400" />
                    <span>{req["users!buyer_id"].name}</span>
                  </div>
                )}
              </div>

              {req.description && (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 mb-4 leading-relaxed">{req.description}</p>
              )}

              {respondedIds.has(req.id) ? (
                <button disabled className="btn btn-primary w-full btn-sm opacity-60 cursor-not-allowed">
                  <CheckCircle2 size={13} /> Responded
                </button>
              ) : (
                <button
                  onClick={() => openRespond(req)}
                  disabled={myCrops.length === 0}
                  className="btn btn-primary w-full btn-sm"
                >
                  <Send size={13} />
                  {myCrops.length === 0 ? "No Active Crops" : "Respond with Crop"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      <Modal
        open={!!respondModal}
        onClose={() => setRespondModal(null)}
        title="Respond to Requirement"
        subtitle={respondModal ? `For: ${respondModal.crop_name}` : ""}
        size="md"
      >
        {respondModal && (
          <form onSubmit={handleRespond} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600">
                <strong>{respondModal.crop_name}</strong> — {respondModal.quantity} {respondModal.unit} needed. Max: ₹{respondModal.max_price}/{respondModal.unit}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Your Crop <span className="text-red-500">*</span></label>
              <select
                value={responseForm.crop_id}
                onChange={e => setResponseForm(f => ({ ...f, crop_id: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">— Select crop —</option>
                {myCrops.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.quantity} {c.unit} @ ₹{c.price_per_unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your Offered Price (₹/{respondModal.unit}) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={responseForm.offered_price}
                onChange={e => setResponseForm(f => ({ ...f, offered_price: e.target.value }))}
                placeholder={`Max: ₹${respondModal.max_price}`}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message (optional)</label>
              <textarea
                value={responseForm.message}
                onChange={e => setResponseForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
                placeholder="Additional info, delivery terms, quality notes..."
                className="input-field resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2 justify-end border-t border-slate-100">
              <button type="button" onClick={() => setRespondModal(null)} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={responding} className="btn btn-primary">
                {responding ? "Sending..." : <><Send size={14} /> Send Response</>}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
