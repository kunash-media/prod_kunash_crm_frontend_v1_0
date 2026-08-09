import { useState, useEffect, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Client-List/ClientList.css";

const API_BASE = "https://crm-api.kunashshowcase.online/api/client/v1";

const EMPTY_CLIENT = {
  firstName: "", lastName: "", contact: "", email: "",
  service: "", project: "", source: "", type: "", assignTo: "",
  totalAmount: "", advanceAmount: "", remainAmount: "", pendingAmount: "",
  remainPayFollowUpDate: "",
};

const currency = (n) =>
  n === null || n === undefined || n === ""
    ? "—"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

/* ── API helpers ── */
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}

async function apiSendJson(path, method, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${method} ${path} failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const StatCard = ({ label, value, icon }) => (
  <div className="cl-stat-card">
    <div className="cl-stat-icon">{icon}</div>
    <div>
      <p className="cl-stat-value">{value}</p>
      <p className="cl-stat-label">{label}</p>
    </div>
  </div>
);

const SectionRow = ({ title, children, last }) => (
  <div className={`cl-section-row ${last ? "cl-section-row-last" : ""}`}>
    <div className="cl-section-row-label">
      <p className="cl-section-row-title">{title}</p>
    </div>
    <div className="cl-section-row-content">{children}</div>
  </div>
);

const ViewClientForm = ({ client, onClose }) => (
  <div className="cl-modal-overlay" onClick={onClose}>
    <div className="cl-modal-panel" onClick={(e) => e.stopPropagation()}>
      <div className="cl-modal-header">
        <h2 className="cl-modal-title">Client details</h2>
        <button className="cl-modal-close-btn" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="cl-modal-body">
        <SectionRow title="Personal information">
          <div className="cl-form-grid">
            <div className="cl-form-field"><label>First name</label><div className="cl-form-value">{client.firstName || "—"}</div></div>
            <div className="cl-form-field"><label>Last name</label><div className="cl-form-value">{client.lastName || "—"}</div></div>
            <div className="cl-form-field"><label>Contact number</label><div className="cl-form-value">{client.contact || "—"}</div></div>
            <div className="cl-form-field"><label>Email address</label><div className="cl-form-value">{client.email || "—"}</div></div>
          </div>
        </SectionRow>

        <SectionRow title="Project information">
          <div className="cl-form-grid">
            <div className="cl-form-field"><label>Service</label><div className="cl-form-value">{client.service || "—"}</div></div>
            <div className="cl-form-field"><label>Project / company</label><div className="cl-form-value">{client.project || "—"}</div></div>
            <div className="cl-form-field"><label>Source</label><div className="cl-form-value">{client.source || "—"}</div></div>
            <div className="cl-form-field"><label>Website type</label><div className="cl-form-value" style={{ textTransform: "capitalize" }}>{client.type || "—"}</div></div>
            <div className="cl-form-field"><label>Assigned to</label><div className="cl-form-value">{client.assignTo || "Unassigned"}</div></div>
          </div>
        </SectionRow>

       <SectionRow title="Payment information" last>
          <div className="cl-form-grid">
            <div className="cl-form-field"><label>Total Amount</label><div className="cl-form-value">{currency(client.totalAmount)}</div></div>
            <div className="cl-form-field"><label>Advance</label><div className="cl-form-value cl-form-value-success">{currency(client.advanceAmount)}</div></div>
            <div className="cl-form-field"><label>Remains</label><div className="cl-form-value cl-form-value-pending">{currency(client.remainAmount)}</div></div>
            <div className="cl-form-field"><label>Pending Payment</label><div className="cl-form-value cl-form-value-pending">{currency(client.pendingAmount)}</div></div>
            <div className="cl-form-field"><label>Remaining Payment Follow-up Date</label><div className="cl-form-value">{client.remainPayFollowUpDate || "—"}</div></div>
          </div>
        </SectionRow>
      </div>

      <div className="cl-modal-footer">
        <button className="cl-btn-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

/* Shared form body for both Add and Edit — required: firstName, contact, service */
const ClientFormFields = ({ form, update, errs }) => (
  <>
    <SectionRow title="Personal information">
      <div className="cl-form-grid">
        <div className="cl-form-field">
          <label>First name *</label>
          <input value={form.firstName} onChange={update("firstName")} className={errs.firstName ? "fe" : ""} />
          {errs.firstName && <span className="fe-msg">{errs.firstName}</span>}
        </div>
        <div className="cl-form-field">
          <label>Last name</label>
          <input value={form.lastName} onChange={update("lastName")} />
        </div>
        <div className="cl-form-field">
          <label>Contact number *</label>
          <input value={form.contact} onChange={update("contact")} className={errs.contact ? "fe" : ""} />
          {errs.contact && <span className="fe-msg">{errs.contact}</span>}
        </div>
        <div className="cl-form-field">
          <label>Email address</label>
          <input value={form.email} onChange={update("email")} />
        </div>
      </div>
    </SectionRow>

    <SectionRow title="Project information">
      <div className="cl-form-grid">
        <div className="cl-form-field">
          <label>Service *</label>
          <input value={form.service} onChange={update("service")} className={errs.service ? "fe" : ""} />
          {errs.service && <span className="fe-msg">{errs.service}</span>}
        </div>
        <div className="cl-form-field"><label>Project / company</label><input value={form.project} onChange={update("project")} /></div>
        <div className="cl-form-field"><label>Source</label><input value={form.source} onChange={update("source")} /></div>
        <div className="cl-form-field">
          <label>Website type</label>
          <select value={form.type} onChange={update("type")}>
            <option value="">— None —</option>
            <option value="static">Static</option>
            <option value="dynamic">Dynamic</option>
            <option value="ecommerce">Ecommerce</option>
            <option value="seo">SEO</option>
          </select>
        </div>
        <div className="cl-form-field"><label>Assigned to</label><input value={form.assignTo} onChange={update("assignTo")} placeholder="e.g. Rahul" /></div>
      </div>
    </SectionRow>

    <SectionRow title="Payment information" last>
      <div className="cl-form-grid">
        <div className="cl-form-field"><label>Total Amount</label><input type="number" min="0" value={form.totalAmount} onChange={update("totalAmount")} /></div>
        <div className="cl-form-field"><label>Advance Amount</label><input type="number" min="0" value={form.advanceAmount} onChange={update("advanceAmount")} /></div>
        <div className="cl-form-field"><label>Remain Amount</label><input type="number" min="0" value={form.remainAmount} onChange={update("remainAmount")} /></div>
        <div className="cl-form-field"><label>Pending Amount</label><input type="number" min="0" value={form.pendingAmount} onChange={update("pendingAmount")} /></div>
        <div className="cl-form-field"><label>Remaining Payment Follow-up Date</label><input type="date" value={form.remainPayFollowUpDate || ""} onChange={update("remainPayFollowUpDate")} /></div>
      </div>
    </SectionRow>
  </>
);

const AddClientForm = ({ onClose, onSave, saving }) => {
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [errs, setErrs] = useState({});
  const update = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.contact.trim()) e.contact = "Contact number is required";
    if (!form.service.trim()) e.service = "Service is required";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    onSave(form);
  };

  return (
    <div className="cl-modal-overlay" onClick={onClose}>
      <div className="cl-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cl-modal-header">
          <h2 className="cl-modal-title">Add client</h2>
          <button className="cl-modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cl-modal-body">
          <ClientFormFields form={form} update={update} errs={errs} />
        </div>

        <div className="cl-modal-footer">
          <button className="cl-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="cl-btn-save" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Add client"}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditClientForm = ({ client, onClose, onSave, saving }) => {
  const [form, setForm] = useState({ ...EMPTY_CLIENT, ...client });
  const [errs, setErrs] = useState({});
  const update = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.contact.trim()) e.contact = "Contact number is required";
    if (!form.service.trim()) e.service = "Service is required";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    onSave(form);
  };

  return (
    <div className="cl-modal-overlay" onClick={onClose}>
      <div className="cl-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cl-modal-header">
          <h2 className="cl-modal-title">Edit client</h2>
          <button className="cl-modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cl-modal-body">
          <ClientFormFields form={form} update={update} errs={errs} />
        </div>

        <div className="cl-modal-footer">
          <button className="cl-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="cl-btn-save" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Assign overlay — prefilled + editable if already assigned ── */
const AssignClientForm = ({ client, onClose, onSave, saving }) => {
  const [assignTo, setAssignTo] = useState(client.assignTo || "");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!assignTo.trim()) { setErr("Please enter a name to assign"); return; }
    onSave(client, assignTo.trim());
  };

  return (
    <div className="cl-modal-overlay" onClick={onClose}>
      <div className="cl-confirm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cl-modal-header" style={{ padding: 0, border: "none", marginBottom: 14 }}>
          <h2 className="cl-modal-title">{client.assignTo ? "Reassign project" : "Assign project"}</h2>
          <button className="cl-modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cl-form-field" style={{ textAlign: "left", marginBottom: 18 }}>
          <label>Assign to</label>
          <input
            value={assignTo}
            placeholder="Enter name"
            autoFocus
            disabled={saving}
            onChange={(e) => { setAssignTo(e.target.value); setErr(""); }}
          />
          {err && <span className="fe-msg">{err}</span>}
        </div>

        <div className="cl-confirm-actions">
          <button className="cl-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="cl-btn-save" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : client.assignTo ? "Update" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirm = ({ client, onCancel, onConfirm, saving }) => (
  <div className="cl-modal-overlay" onClick={onCancel}>
    <div className="cl-confirm-panel" onClick={(e) => e.stopPropagation()}>
      <div className="cl-confirm-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" /><path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </div>
      <h3 className="cl-confirm-title">Delete client?</h3>
      <p className="cl-confirm-body">
        This will permanently remove <strong>{client.firstName} {client.lastName}</strong> and all associated records. This can't be undone.
      </p>
      <div className="cl-confirm-actions">
        <button className="cl-btn-cancel" onClick={onCancel} disabled={saving}>No, keep it</button>
        <button className="cl-btn-delete" onClick={() => onConfirm(client)} disabled={saving}>
          {saving ? "Deleting…" : "Yes, delete"}
        </button>
      </div>
    </div>
  </div>
);

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState({ totalClients: 0, totalWebsites: 0, staticCount: 0, dynamicCount: 0 });

  const [viewClient, setViewClient] = useState(null);
  const [editClient, setEditClient] = useState(null);
  const [assignClient, setAssignClient] = useState(null);
  const [deleteClient, setDeleteClient] = useState(null);
  const [addingNew, setAddingNew] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const page = await apiGet(`/all-clients?page=0&size=200`);
      setClients(page.content || []);
    } catch (err) {
      console.error("Failed to load clients:", err);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiGet(`/stats`);
      setStats(data);
    } catch (err) {
      console.error("Failed to load client stats:", err);
      toast.error("Failed to load stats");
    }
  }, []);

  useEffect(() => { fetchClients(); fetchStats(); }, [fetchClients, fetchStats]);

  const toNum = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

const buildPayload = (form) => ({
    firstName: form.firstName,
    lastName: form.lastName,
    contact: form.contact,
    email: form.email,
    service: form.service,
    project: form.project,
    source: form.source,
    type: form.type,
    assignTo: form.assignTo,
    totalAmount: toNum(form.totalAmount),
    advanceAmount: toNum(form.advanceAmount),
    remainAmount: toNum(form.remainAmount),
    pendingAmount: toNum(form.pendingAmount),
    remainPayFollowUpDate: form.remainPayFollowUpDate || null,
  });

  const handleAddClient = async (form) => {
    setSaving(true);
    try {
      await apiSendJson(``, "POST", buildPayload(form));
      toast.success("Client added");
      setAddingNew(false);
      await fetchClients();
      await fetchStats();
    } catch (err) {
      console.error("Add client failed:", err);
      toast.error(err.message || "Failed to add client");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (form) => {
    setSaving(true);
    try {
      await apiSendJson(`/${form.clientPrimeId}`, "PATCH", buildPayload(form));
      toast.success("Client updated");
      setEditClient(null);
      await fetchClients();
      await fetchStats();
    } catch (err) {
      console.error("Update client failed:", err);
      toast.error(err.message || "Failed to update client");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignSubmit = async (client, assignTo) => {
    setSaving(true);
    try {
      await apiSendJson(`/${client.clientPrimeId}/assign`, "PATCH", { assignTo });
      toast.success("Project assigned");
      setAssignClient(null);
      await fetchClients();
    } catch (err) {
      console.error("Assign failed:", err);
      toast.error(err.message || "Failed to assign project");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async (client) => {
    setSaving(true);
    try {
      await apiSendJson(`/${client.clientPrimeId}`, "DELETE");
      toast.success("Client deleted");
      setDeleteClient(null);
      await fetchClients();
      await fetchStats();
    } catch (err) {
      console.error("Delete client failed:", err);
      toast.error(err.message || "Failed to delete client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="client-root">
      <ToastContainer position="top-right" autoClose={2500} theme="light" />

      <div className="cl-stat-grid">
        <StatCard label="Total clients" value={stats.totalClients} icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        } />
        <StatCard label="Total websites" value={stats.totalWebsites} icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20z" />
          </svg>
        } />
        <StatCard label="Static websites" value={stats.staticCount} icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" />
          </svg>
        } />
        <StatCard label="Dynamic websites" value={stats.dynamicCount} icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        } />
      </div>

      <div className="cl-table-top">
        <button className="cl-btn-save" onClick={() => setAddingNew(true)}>+ Add Client</button>
      </div>

      <div className="cl-table-card">
        <div className="cl-table-scroll">
          <table className="cl-table">
            <thead>
              <tr className="tr-table">
                <th>First name</th><th>Last name</th><th>Contact</th><th>Email</th>
                <th>Service</th><th>Project</th><th>Total Amount</th><th>Advance</th>
                <th>Remain</th><th>Remain Follow-up</th><th>Source</th><th>Assigned To</th><th className="cl-col-sticky">Action</th>              
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={13} style={{ textAlign: "center", padding: "20px" }}>Loading clients…</td></tr>
              )}
              {!loading && clients.length === 0 && (
                <tr><td colSpan={13} style={{ textAlign: "center", padding: "20px" }}>No clients yet — add one or convert a lead.</td></tr>              )}
              {!loading && clients.map((c) => (
                <tr key={c.clientPrimeId}>
                  <td>{c.firstName}</td>
                  <td>{c.lastName}</td>
                  <td>{c.contact}</td>
                  <td className="cl-cell-muted">{c.email}</td>
                  <td>{c.service}</td>
                  <td>{c.project}</td>
                  <td>{currency(c.totalAmount)}</td>
                  <td className="cl-cell-success">{currency(c.advanceAmount)}</td>
                  <td className={c.remainAmount > 0 ? "cl-cell-pending" : "cl-cell-muted"}>{currency(c.remainAmount)}</td>
                  <td className={c.remainPayFollowUpDate ? "" : "cl-cell-muted"}>{c.remainPayFollowUpDate || "—"}</td>
                  <td>{c.source}</td>    
                  <td className={c.assignTo ? "" : "cl-cell-muted"}>{c.assignTo || "Unassigned"}</td>
                  <td className="cl-col-sticky">
                    <div className="cl-action-btns">
                      <button className="cl-icon-btn" title="View" onClick={() => setViewClient(c)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="cl-icon-btn" title="Edit" onClick={() => setEditClient(c)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="cl-icon-btn" title={c.assignTo ? "Reassign" : "Assign"} onClick={() => setAssignClient(c)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                          <line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
                        </svg>
                      </button>
                      <button className="cl-icon-btn cl-icon-btn-danger" title="Delete" onClick={() => setDeleteClient(c)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" /><path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewClient && <ViewClientForm client={viewClient} onClose={() => setViewClient(null)} />}
      {addingNew && <AddClientForm saving={saving} onClose={() => setAddingNew(false)} onSave={handleAddClient} />}
      {editClient && <EditClientForm client={editClient} saving={saving} onClose={() => setEditClient(null)} onSave={handleSaveEdit} />}
      {assignClient && <AssignClientForm client={assignClient} saving={saving} onClose={() => setAssignClient(null)} onSave={handleAssignSubmit} />}
      {deleteClient && <DeleteConfirm client={deleteClient} saving={saving} onCancel={() => setDeleteClient(null)} onConfirm={handleConfirmDelete} />}
    </div>
  );
};

export default ClientList;