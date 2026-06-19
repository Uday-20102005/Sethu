import { useEffect, useState } from "react";
import { Sprout, Plus, Edit2, Trash2, Search, Filter, X, Upload, Calendar } from "lucide-react";
import { farmerApi } from "../../api/farmer";
import { flashSalesApi } from "../../api/resources";
import { useToast } from "../../context/ToastContext";
import Modal, { ConfirmModal } from "../../components/ui/Modal";
import { StatusBadge, CategoryBadge } from "../../components/ui/Badge";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { format, parseISO } from "date-fns";

const CATEGORIES = ["Vegetables", "Fruits", "Grains", "Dairy", "Spices", "Pulses", "Others"];
const UNITS = ["kg", "ton", "quintal", "dozen", "piece", "liter"];
const STATUSES = ["active", "sold", "expired"];

const EMPTY_FORM = {
  name: "", category: "Vegetables", quantity: "", unit: "kg",
  price_per_unit: "", description: "", location: "",
  harvest_date: "", expiry_date: "", images: [],
};

export default function MyCrops() {
  const [crops, setCrops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCrop, setEditCrop] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await farmerApi.getMyCrops();
      setCrops(res.data || []);
    } catch { toast.error("Failed to load crops"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let f = crops;
    if (search) f = f.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase()));
    if (catFilter) f = f.filter(c => c.category?.toLowerCase() === catFilter.toLowerCase());
    if (statusFilter) f = f.filter(c => c.status === statusFilter);
    setFiltered(f);
  }, [crops, search, catFilter, statusFilter]);

  const openAdd = () => { setEditCrop(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (crop) => {
    setEditCrop(crop);
    setForm({
      name: crop.name, category: crop.category, quantity: crop.quantity,
      unit: crop.unit, price_per_unit: crop.price_per_unit,
      description: crop.description || "", location: crop.location,
      harvest_date: crop.harvest_date ? crop.harvest_date.slice(0, 10) : "",
      expiry_date: crop.expiry_date ? crop.expiry_date.slice(0, 10) : "",
      images: crop.images || [],
    });
    setModalOpen(true);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Crop name required"); return; }
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0) { toast.error("Valid quantity required"); return; }
    if (!form.price_per_unit || isNaN(form.price_per_unit) || Number(form.price_per_unit) <= 0) { toast.error("Valid price required"); return; }
    if (!form.location.trim()) { toast.error("Location required"); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        price_per_unit: Number(form.price_per_unit),
        harvest_date: form.harvest_date || null,
        expiry_date: form.expiry_date || null,
      };
      if (editCrop) {
        await farmerApi.updateCrop(editCrop.id, payload);
        toast.success("Crop updated successfully");
      } else {
        await farmerApi.createCrop(payload);
        toast.success("Crop listed successfully!");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save crop");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await farmerApi.deleteCrop(deleteTarget.id);
      toast.success("Crop removed");
      setDeleteTarget(null);
      load();
    } catch { toast.error("Failed to delete crop"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">My Crops</h1>
          <p className="page-subtitle">Manage your crop listings and inventory</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={16} /> Add New Crop
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search crops or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field w-40">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-36">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        {(search || catFilter || statusFilter) && (
          <button onClick={() => { setSearch(""); setCatFilter(""); setStatusFilter(""); }} className="btn btn-secondary btn-sm">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Stats summary */}
      {!loading && crops.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          {[
            { label: "Total", val: crops.length, color: "text-slate-700" },
            { label: "Active", val: crops.filter(c=>c.status==="active").length, color: "text-green-600" },
            { label: "Sold", val: crops.filter(c=>c.status==="sold").length, color: "text-slate-500" },
            { label: "Showing", val: filtered.length, color: "text-blue-600" },
          ].map(({label, val, color}) => (
            <span key={label} className="text-slate-500">{label}: <strong className={color}>{val}</strong></span>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            type="crops"
            title={search || catFilter || statusFilter ? "No crops match your filters" : "No crops listed yet"}
            description={search || catFilter || statusFilter ? "Try adjusting your search or filters" : "Add your first crop to start receiving purchase requests from buyers."}
            action={!search && !catFilter && !statusFilter ? openAdd : undefined}
            actionLabel="Add Your First Crop"
          />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Crop</th>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Quantity</th>
                <th className="text-left px-4 py-3 font-semibold">Price</th>
                <th className="text-left px-4 py-3 font-semibold">Location</th>
                <th className="text-left px-4 py-3 font-semibold">Expiry</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((crop, i) => (
                <tr key={crop.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                        <Sprout size={15} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{crop.name}</p>
                        {crop.description && <p className="text-xs text-slate-400 truncate max-w-32">{crop.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><CategoryBadge category={crop.category} /></td>
                  <td className="px-4 py-4 text-slate-700 font-medium">{crop.quantity} {crop.unit}</td>
                  <td className="px-4 py-4 font-bold text-slate-900">₹{crop.price_per_unit}/{crop.unit}</td>
                  <td className="px-4 py-4 text-slate-500 text-xs">{crop.location}</td>
                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {crop.expiry_date ? format(parseISO(crop.expiry_date), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={crop.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(crop)} className="btn btn-secondary btn-sm btn-icon" title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(crop)} className="btn btn-danger btn-sm btn-icon" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCrop ? "Edit Crop" : "Add New Crop"}
        subtitle={editCrop ? "Update your crop listing details" : "List your crop on the marketplace"}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Crop Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={set("name")} placeholder="e.g. Tomatoes" className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
              <select value={form.category} onChange={set("category")} className="input-field">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantity <span className="text-red-500">*</span></label>
              <input type="number" min="0.1" step="0.1" value={form.quantity} onChange={set("quantity")} placeholder="e.g. 500" className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Unit</label>
              <select value={form.unit} onChange={set("unit")} className="input-field">
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price/Unit (₹) <span className="text-red-500">*</span></label>
              <input type="number" min="0.01" step="0.01" value={form.price_per_unit} onChange={set("price_per_unit")} placeholder="e.g. 25" className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location <span className="text-red-500">*</span></label>
            <input type="text" value={form.location} onChange={set("location")} placeholder="e.g. Guntur, Andhra Pradesh" className="input-field" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Harvest Date</label>
              <input type="date" value={form.harvest_date} onChange={set("harvest_date")} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={set("expiry_date")} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={set("description")} rows={2} placeholder="Quality details, growing method, certifications..." className="input-field resize-none" />
          </div>
          {editCrop && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
              <select value={form.status || editCrop.status} onChange={set("status")} className="input-field">
                {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2 justify-end border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving..." : editCrop ? "Update Crop" : "Publish Crop"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Crop Listing"
        description={`Are you sure you want to remove "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
