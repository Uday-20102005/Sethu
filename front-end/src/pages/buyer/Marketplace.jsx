import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Sprout, MapPin, Package, Send, X, Zap } from "lucide-react";
import { buyerApi } from "../../api/buyer";
import { flashSalesApi } from "../../api/resources";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/ui/Modal";
import { StatusBadge, CategoryBadge } from "../../components/ui/Badge";
import { SkeletonCropCards } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { format, parseISO } from "date-fns";

const CATEGORIES = ["Vegetables", "Fruits", "Grains", "Dairy", "Spices", "Pulses", "Others"];

export default function Marketplace() {
  const [crops, setCrops] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Request Modal
  const [reqModal, setReqModal] = useState(null);
  const [reqForm, setReqForm] = useState({ quantity: "", proposed_price: "", message: "" });
  const [requesting, setRequesting] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [cropsRes, salesRes] = await Promise.all([
        buyerApi.getMarketplaceCrops(),
        flashSalesApi.getAll(true),
      ]);
      const activeCrops = (cropsRes.data || []).filter(c => c.status === "active");
      setCrops(activeCrops);
      setFlashSales(salesRes.data || []);
    } catch { toast.error("Failed to load marketplace"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let f = crops;
    if (search) f = f.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase()));
    if (catFilter) f = f.filter(c => c.category?.toLowerCase() === catFilter.toLowerCase());
    if (maxPrice) f = f.filter(c => c.price_per_unit <= Number(maxPrice));
    setFiltered(f);
  }, [crops, search, catFilter, maxPrice]);

  const openRequest = (crop) => {
    setReqModal(crop);
    setReqForm({ quantity: crop.quantity, proposed_price: crop.price_per_unit, message: "" });
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    const qty = Number(reqForm.quantity);
    if (!qty || qty <= 0 || qty > reqModal.quantity) { toast.error(`Quantity must be between 1 and ${reqModal.quantity}`); return; }
    setRequesting(true);
    try {
      await buyerApi.requestCrop({
        crop_id: reqModal.id,
        quantity: qty,
        proposed_price: reqForm.proposed_price ? Number(reqForm.proposed_price) : null,
        message: reqForm.message,
      });
      toast.success("Purchase request sent to farmer!");
      setReqModal(null);
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed to send request"); }
    finally { setRequesting(false); }
  };

  // Enhance crops with flash sale data if applicable
  const enhancedFiltered = filtered.map(crop => {
    const sale = flashSales.find(s => s.crop_id === crop.id);
    if (!sale) return crop;
    const discounted = crop.price_per_unit - (crop.price_per_unit * sale.discount_percentage / 100);
    return { ...crop, flashSale: sale, discountedPrice: discounted };
  });

  return (
    <div className="page-enter space-y-6">
      <div className="page-header">
        <h1 className="page-title">Marketplace</h1>
        <p className="page-subtitle">Browse fresh produce directly from verified farmers</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search crops, locations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field w-40">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="relative w-40">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="input-field pl-8"
          />
        </div>
        {(search || catFilter || maxPrice) && (
          <button onClick={() => { setSearch(""); setCatFilter(""); setMaxPrice(""); }} className="btn btn-secondary btn-sm px-3">
            <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonCropCards count={6} />
      ) : enhancedFiltered.length === 0 ? (
        <div className="card">
          <EmptyState
            type="search"
            title="No crops found"
            description="Try adjusting your filters or search terms."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {enhancedFiltered.map((crop, i) => (
            <div key={crop.id} className={`card overflow-hidden animate-fade-in group ${crop.flashSale ? "border-amber-200" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
              {/* Image / Header area */}
              <div className="relative h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                {crop.images && crop.images.length > 0 ? (
                  <img src={crop.images[0]} alt={crop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Sprout size={48} className="text-green-200 group-hover:scale-110 transition-transform duration-500" />
                )}
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <CategoryBadge category={crop.category} />
                  {crop.flashSale && (
                    <span className="badge-flash text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <Zap size={10} /> {crop.flashSale.discount_percentage}% OFF
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg truncate">{crop.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin size={12} /> {crop.location || "Location not specified"}
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    {crop.flashSale ? (
                      <>
                        <p className="text-xs text-slate-400 line-through">₹{crop.price_per_unit}/{crop.unit}</p>
                        <p className="text-xl font-bold text-green-700">₹{crop.discountedPrice.toFixed(2)}<span className="text-sm font-semibold text-slate-500">/{crop.unit}</span></p>
                      </>
                    ) : (
                      <p className="text-xl font-bold text-slate-900">₹{crop.price_per_unit}<span className="text-sm font-semibold text-slate-500">/{crop.unit}</span></p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Available</p>
                    <p className="text-sm font-bold text-slate-800">{crop.quantity} {crop.unit}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button onClick={() => openRequest(crop)} className="btn btn-primary w-full">
                    <Package size={15} /> Request to Buy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Modal */}
      <Modal
        open={!!reqModal}
        onClose={() => setReqModal(null)}
        title="Send Purchase Request"
        subtitle={reqModal ? `To farmer for ${reqModal.name}` : ""}
        size="sm"
      >
        {reqModal && (
          <form onSubmit={handleRequest} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center mb-2">
              <div>
                <p className="text-xs text-slate-500">Available</p>
                <p className="text-sm font-bold text-slate-800">{reqModal.quantity} {reqModal.unit}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Asking Price</p>
                <p className="text-sm font-bold text-green-700">₹{reqModal.flashSale ? reqModal.discountedPrice.toFixed(2) : reqModal.price_per_unit}/{reqModal.unit}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantity you need ({reqModal.unit}) <span className="text-red-500">*</span></label>
              <input
                type="number" min="0.1" max={reqModal.quantity} step="0.1"
                value={reqForm.quantity} onChange={e => setReqForm(f => ({...f, quantity: e.target.value}))}
                className="input-field" required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Proposed Price (₹/{reqModal.unit})</label>
              <input
                type="number" min="0.01" step="0.01"
                value={reqForm.proposed_price} onChange={e => setReqForm(f => ({...f, proposed_price: e.target.value}))}
                placeholder={`Leave blank to accept ₹${reqModal.flashSale ? reqModal.discountedPrice.toFixed(2) : reqModal.price_per_unit}`}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message to Farmer</label>
              <textarea
                value={reqForm.message} onChange={e => setReqForm(f => ({...f, message: e.target.value}))}
                rows={3} placeholder="Ask about quality, delivery options..."
                className="input-field resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setReqModal(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={requesting} className="btn btn-primary flex-1">
                {requesting ? "Sending..." : <><Send size={15} /> Send Request</>}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
