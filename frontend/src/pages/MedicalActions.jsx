import { useCallback, useEffect, useMemo, useState } from "react";
import { yiiApi } from "../api/client";

const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const initialAction = {
  name: "",
  description: "",
  tariff: "",
  is_active: true,
};

const initialVisitAction = {
  visit_id: "",
  medical_action_id: "",
  quantity: 1,
};

function getError(error) {
  const data = error.response?.data;
  if (typeof data?.message === "string") return data.message;
  return error.message || "Terjadi kesalahan.";
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500";

const buttonClass =
  "rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50";

export default function MedicalActions() {
  const [tab, setTab] = useState("master");
  const [actions, setActions] = useState([]);
  const [visitActions, setVisitActions] = useState([]);
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const [actionForm, setActionForm] = useState(initialAction);
  const [visitForm, setVisitForm] = useState(initialVisitAction);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all([
        yiiApi.get("/medical-actions"),
        yiiApi.get("/visit-actions"),
        yiiApi.get("/visits"),
        yiiApi.get("/patients"),
      ]);

      setActions(responses[0].data.data || []);
      setVisitActions(responses[1].data.data || []);
      setVisits(responses[2].data.data || []);
      setPatients(responses[3].data.data || []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const actionMap = useMemo(
    () => new Map(actions.map((item) => [item.id, item])),
    [actions],
  );

  const visitMap = useMemo(
    () => new Map(visits.map((item) => [item.id, item])),
    [visits],
  );

  const patientMap = useMemo(
    () => new Map(patients.map((item) => [item.id, item])),
    [patients],
  );

  const filteredActions = actions.filter((item) =>
    `${item.code} ${item.name} ${item.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const filteredVisitActions = visitActions.filter((item) => {
    const visit = visitMap.get(item.visit_id);
    const patient = patientMap.get(visit?.patient_id);
    const action = actionMap.get(item.medical_action_id);

    return `${visit?.code || ""} ${patient?.full_name || ""} ${action?.name || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  function openCreateAction() {
    setActionForm({ ...initialAction });
    setModal({ type: "action", id: null });
  }

  function openEditAction(item) {
    setActionForm({
      name: item.name || "",
      description: item.description || "",
      tariff: item.tariff || "",
      is_active: Boolean(item.is_active),
    });
    setModal({ type: "action", id: item.id });
  }

  function openCreateVisitAction() {
    setVisitForm({ ...initialVisitAction });
    setModal({ type: "visit-action" });
  }

  async function saveAction(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: actionForm.name.trim(),
        description: actionForm.description.trim(),
        tariff: Number(actionForm.tariff),
        is_active: actionForm.is_active,
      };

      if (modal.id) {
        await yiiApi.put(`/medical-actions/${modal.id}`, payload);
      } else {
        await yiiApi.post("/medical-actions", payload);
      }

      setModal(null);
      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  async function saveVisitAction(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await yiiApi.post("/visit-actions", {
        visit_id: visitForm.visit_id,
        medical_action_id: visitForm.medical_action_id,
        quantity: Number(visitForm.quantity),
      });

      setModal(null);
      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  const selectedAction = actionMap.get(visitForm.medical_action_id);
  const estimatedSubtotal =
    Number(selectedAction?.tariff || 0) * Number(visitForm.quantity || 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tindakan Medis</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola master tindakan dan tindakan pasien per kunjungan.
          </p>
        </div>

        <button
          type="button"
          onClick={tab === "master" ? openCreateAction : openCreateVisitAction}
          className={buttonClass}
        >
          + {tab === "master" ? "Tambah Tindakan" : "Catat Tindakan"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => {
              setTab("master");
              setSearch("");
            }}
            className={`px-6 py-4 text-sm font-semibold ${
              tab === "master"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500"
            }`}
          >
            Master Tindakan
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("visits");
              setSearch("");
            }}
            className={`px-6 py-4 text-sm font-semibold ${
              tab === "visits"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500"
            }`}
          >
            Tindakan Kunjungan
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <input
            type="text"
            placeholder={
              tab === "master"
                ? "Cari kode atau nama tindakan..."
                : "Cari kunjungan, pasien, atau tindakan..."
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${inputClass} max-w-md`}
          />
          <span className="text-sm text-slate-500">
            {tab === "master"
              ? `${filteredActions.length} tindakan`
              : `${filteredVisitActions.length} catatan`}
          </span>
        </div>

        {error && (
          <div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              {tab === "master" ? (
                <tr>
                  {[
                    "No",
                    "Kode",
                    "Nama Tindakan",
                    "Deskripsi",
                    "Tarif",
                    "Status",
                    "Aksi",
                  ].map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              ) : (
                <tr>
                  {[
                    "No",
                    "Kode Kunjungan",
                    "Pasien",
                    "Tindakan",
                    "Jumlah",
                    "Harga Satuan",
                    "Subtotal",
                  ].map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : tab === "master" ? (
                filteredActions.length ? (
                  filteredActions.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{item.code}</td>
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {item.description || "-"}
                      </td>
                      <td className="px-4 py-3">{money(item.tariff)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            item.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openEditAction(item)}
                          className="font-medium text-orange-600 hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Tidak ada tindakan medis ditemukan.
                    </td>
                  </tr>
                )
              ) : filteredVisitActions.length ? (
                filteredVisitActions.map((item, index) => {
                  const visit = visitMap.get(item.visit_id);
                  const patient = patientMap.get(visit?.patient_id);
                  const action = actionMap.get(item.medical_action_id);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">
                        {visit?.code || item.visit_id}
                      </td>
                      <td className="px-4 py-3">{patient?.full_name || "-"}</td>
                      <td className="px-4 py-3">{action?.name || "-"}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">{money(item.unit_price)}</td>
                      <td className="px-4 py-3 font-semibold">
                        {money(item.subtotal)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Belum ada tindakan kunjungan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.type === "action" && (
        <Modal
          title={modal.id ? "Edit Tindakan Medis" : "Tambah Tindakan Medis"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={saveAction} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Nama Tindakan
              </label>
              <input
                required
                className={inputClass}
                value={actionForm.name}
                onChange={(e) =>
                  setActionForm({ ...actionForm, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Deskripsi
              </label>
              <textarea
                rows={3}
                className={inputClass}
                value={actionForm.description}
                onChange={(e) =>
                  setActionForm({
                    ...actionForm,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Tarif (Rp)
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={actionForm.tariff}
                onChange={(e) =>
                  setActionForm({ ...actionForm, tariff: e.target.value })
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={actionForm.is_active}
                onChange={(e) =>
                  setActionForm({
                    ...actionForm,
                    is_active: e.target.checked,
                  })
                }
              />
              Tindakan aktif
            </label>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border px-4 py-2"
              >
                Batal
              </button>
              <button disabled={saving} className={buttonClass}>
                {saving ? "Menyimpan..." : "Simpan Tindakan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === "visit-action" && (
        <Modal title="Catat Tindakan Kunjungan" onClose={() => setModal(null)}>
          <form onSubmit={saveVisitAction} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Kunjungan Pasien
              </label>
              <select
                required
                className={inputClass}
                value={visitForm.visit_id}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, visit_id: e.target.value })
                }
              >
                <option value="">Pilih kunjungan</option>
                {visits.map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    {visit.code} -{" "}
                    {patientMap.get(visit.patient_id)?.full_name || "Pasien"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Tindakan Medis
              </label>
              <select
                required
                className={inputClass}
                value={visitForm.medical_action_id}
                onChange={(e) =>
                  setVisitForm({
                    ...visitForm,
                    medical_action_id: e.target.value,
                  })
                }
              >
                <option value="">Pilih tindakan</option>
                {actions
                  .filter((action) => action.is_active)
                  .map((action) => (
                    <option key={action.id} value={action.id}>
                      {action.name} - {money(action.tariff)}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Jumlah Tindakan
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                className={inputClass}
                value={visitForm.quantity}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, quantity: e.target.value })
                }
              />
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-slate-500">Estimasi Subtotal</p>
              <p className="mt-1 text-xl font-bold text-blue-700">
                {money(estimatedSubtotal)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Nilai akhir ditentukan backend berdasarkan tarif tindakan.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border px-4 py-2"
              >
                Batal
              </button>
              <button disabled={saving} className={buttonClass}>
                {saving ? "Menyimpan..." : "Simpan Tindakan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
