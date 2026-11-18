import { useCallback, useEffect, useMemo, useState } from "react";
import { yiiApi, nodeApi } from "../api/client";

const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

const buttonClass =
  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const emptyRequest = {
  visit_id: "",
  examination_name: "",
  notes: "",
  tariff: "",
};

const emptyResult = {
  result_value: "",
  unit: "",
  reference_range: "",
  notes: "",
};

function getError(error) {
  const data = error?.response?.data;

  if (typeof data?.message === "string") {
    return data.message;
  }

  if (typeof data?.error === "string") {
    return data.error;
  }

  if (Array.isArray(data)) {
    return data.map((item) => item.message).join(", ");
  }

  return error?.message || "Terjadi kesalahan.";
}

function Modal({ title, children, onClose, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="text-xl text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-5">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Laboratory() {
  const [tab, setTab] = useState("requests");

  const [requests, setRequests] = useState([]);
  const [integrationRequests, setIntegrationRequests] = useState([]);
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const [requestForm, setRequestForm] = useState({
    ...emptyRequest,
  });

  const [resultForm, setResultForm] = useState({
    ...emptyResult,
  });

  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        yiiApi.get("/lab-requests"),
        nodeApi.get("/lab/requests"),
        yiiApi.get("/visits"),
        yiiApi.get("/patients"),
      ]);

      const [yiiLabs, nodeLabs, visitsResult, patientsResult] = results;

      const errors = [];

      if (yiiLabs.status === "fulfilled") {
        setRequests(yiiLabs.value.data.data || []);
      } else {
        setRequests([]);
        errors.push(`Yii2: ${getError(yiiLabs.reason)}`);
      }

      if (nodeLabs.status === "fulfilled") {
        setIntegrationRequests(nodeLabs.value.data.data || []);
      } else {
        setIntegrationRequests([]);
        errors.push(`Node.js: ${getError(nodeLabs.reason)}`);
      }

      if (visitsResult.status === "fulfilled") {
        setVisits(visitsResult.value.data.data || []);
      } else {
        setVisits([]);
        errors.push(`Kunjungan: ${getError(visitsResult.reason)}`);
      }

      if (patientsResult.status === "fulfilled") {
        setPatients(patientsResult.value.data.data || []);
      } else {
        setPatients([]);
        errors.push(`Pasien: ${getError(patientsResult.reason)}`);
      }

      if (errors.length > 0) {
        setError(errors.join(" | "));
      }
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================
  // DATA MAPPING
  // ==========================================

  const visitMap = useMemo(
    () => new Map(visits.map((visit) => [visit.id, visit])),
    [visits],
  );

  const patientMap = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient])),
    [patients],
  );

  function getPatientName(visitId) {
    const visit = visitMap.get(visitId);
    const patient = patientMap.get(visit?.patient_id);

    return patient?.full_name || patient?.name || "-";
  }

  function getVisitCode(visitId) {
    return visitMap.get(visitId)?.code || "-";
  }

  // ==========================================
  // FILTER & STATISTICS
  // ==========================================

  const activeRequests = tab === "requests" ? requests : integrationRequests;

  const filteredRequests = activeRequests.filter((item) => {
    const keyword = search.toLowerCase().trim();

    const matchesSearch = [
      item.code,
      item.examination_name,
      getVisitCode(item.visit_id),
      getPatientName(item.visit_id),
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(keyword),
    );

    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCount = requests.length;

  const pendingCount = requests.filter(
    (item) => item.status === "PENDING",
  ).length;

  const completedCount = requests.filter(
    (item) => item.status === "COMPLETED",
  ).length;

  // ==========================================
  // TAB & MODAL
  // ==========================================

  function changeTab(value) {
    setTab(value);
    setSearch("");
    setStatusFilter("ALL");
    setError("");
  }

  function closeModal() {
    if (saving) return;

    setModal(null);
    setSelected(null);
    setDetail(null);
    setModalError("");
  }

  function openCreate() {
    setRequestForm({ ...emptyRequest });
    setModalError("");
    setModal("create");
  }

  function openResult(item) {
    if (tab !== "integration") return;
    if (item.status !== "PENDING") return;

    setSelected(item);
    setResultForm({ ...emptyResult });
    setModalError("");
    setModal("result");
  }

  async function openDetail(item) {
    setSelected(item);
    setDetail(null);
    setModalError("");
    setDetailLoading(true);
    setModal("detail");

    try {
      // Detail diambil dari Yii2 karena
      // response Yii2 memiliki array results.
      const response = await yiiApi.get(`/lab-requests/${item.id}`);

      setDetail(response.data.data);
    } catch (err) {
      setModalError(getError(err));
    } finally {
      setDetailLoading(false);
    }
  }

  // ==========================================
  // CREATE LAB REQUEST VIA YII2
  // ==========================================

  async function createRequest(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setModalError("");

    try {
      const payload = {
        visit_id: requestForm.visit_id,
        examination_name: requestForm.examination_name.trim(),
        notes: requestForm.notes.trim(),
        tariff: Number(requestForm.tariff),
      };

      if (!payload.visit_id) {
        throw new Error("Silakan pilih kunjungan pasien.");
      }

      if (!payload.examination_name) {
        throw new Error("Nama pemeriksaan wajib diisi.");
      }

      if (
        requestForm.tariff === "" ||
        !Number.isFinite(payload.tariff) ||
        payload.tariff < 0
      ) {
        throw new Error("Tarif pemeriksaan tidak valid.");
      }

      await yiiApi.post("/lab-requests", payload);

      setModal(null);
      setRequestForm({ ...emptyRequest });

      await loadData();
    } catch (err) {
      setModalError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // SAVE LAB RESULT VIA NODE.JS
  // ==========================================

  async function saveResult(event) {
    event.preventDefault();

    if (saving || !selected) return;

    setSaving(true);
    setModalError("");

    try {
      const payload = {
        lab_request_id: selected.id,
        result_value: resultForm.result_value.trim(),
        unit: resultForm.unit.trim(),
        reference_range: resultForm.reference_range.trim(),
        notes: resultForm.notes.trim(),
      };

      if (!payload.result_value) {
        throw new Error("Nilai hasil pemeriksaan wajib diisi.");
      }

      if (!payload.unit) {
        throw new Error("Satuan hasil pemeriksaan wajib diisi.");
      }

      // Node.js menangani penyimpanan
      // hasil dan perubahan status lab.
      await nodeApi.post("/lab/results", payload);

      setModal(null);
      setSelected(null);
      setResultForm({ ...emptyResult });

      await loadData();
    } catch (err) {
      setModalError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratorium</h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola pemeriksaan dan hasil laboratorium pasien.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>

          {/* Tambah hanya di tab Yii2 */}
          {tab === "requests" && (
            <button type="button" onClick={openCreate} className={buttonClass}>
              + Tambah Pemeriksaan
            </button>
          )}
        </div>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Pemeriksaan",
            value: totalCount,
          },
          {
            label: "Menunggu Hasil",
            value: pendingCount,
          },
          {
            label: "Selesai",
            value: completedCount,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
        {/* TABS */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => changeTab("requests")}
            className={`border-b-2 px-5 py-4 text-sm font-medium ${
              tab === "requests"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Permintaan Laboratorium
          </button>

          <button
            type="button"
            onClick={() => changeTab("integration")}
            className={`border-b-2 px-5 py-4 text-sm font-medium ${
              tab === "integration"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Integrasi Node.js
          </button>
        </div>

        {/* TAB DESCRIPTION */}
        <div className="px-4 pt-4">
          {tab === "requests" ? (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <p className="font-semibold">Permintaan Laboratorium (Yii2)</p>
              <p className="mt-1">
                Kelola permintaan pemeriksaan laboratorium melalui backend Yii2.
                Tambahkan pemeriksaan baru dan lihat detail hasil pasien.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold">Integrasi Laboratorium (Node.js)</p>
              <p className="mt-1">
                Data permintaan diambil melalui API Node.js. Petugas
                laboratorium dapat menginput hasil pemeriksaan untuk permintaan
                berstatus menunggu.
              </p>
            </div>
          )}
        </div>

        {/* SEARCH & FILTER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <input
            className={`${inputClass} max-w-sm`}
            placeholder="Cari kode, pasien, atau pemeriksaan..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="w-full max-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="COMPLETED">Selesai</option>
          </select>
        </div>

        {/* ERROR */}
        {error && (
          <div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[
                  "No",
                  "Kode Lab",
                  "Kunjungan",
                  "Pasien",
                  "Pemeriksaan",
                  "Tarif",
                  "Status",
                  "Aksi",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-4 py-3 font-semibold"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Memuat data laboratorium...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Tidak ada pemeriksaan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{index + 1}</td>

                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {item.code}
                    </td>

                    <td className="px-4 py-3">{getVisitCode(item.visit_id)}</td>

                    <td className="px-4 py-3">
                      {getPatientName(item.visit_id)}
                    </td>

                    <td className="px-4 py-3">{item.examination_name}</td>

                    <td className="whitespace-nowrap px-4 py-3">
                      {rupiah(item.tariff)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {item.status === "COMPLETED" ? "Selesai" : "Menunggu"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openDetail(item)}
                        className="mr-3 font-medium text-blue-600 hover:underline"
                      >
                        Detail
                      </button>

                      {/* Input hasil hanya di Node.js */}
                      {tab === "integration" && item.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => openResult(item)}
                          className="font-medium text-green-600 hover:underline"
                        >
                          Input Hasil
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================
          MODAL CREATE REQUEST
      ===================================== */}

      {modal === "create" && (
        <Modal
          title="Tambah Permintaan Laboratorium"
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Batal
              </button>

              <button
                type="submit"
                form="lab-create-form"
                disabled={saving}
                className={buttonClass}
              >
                {saving ? "Menyimpan..." : "Simpan Pemeriksaan"}
              </button>
            </>
          }
        >
          <form
            id="lab-create-form"
            onSubmit={createRequest}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Kunjungan Pasien
              </label>

              <select
                required
                className={inputClass}
                value={requestForm.visit_id}
                onChange={(event) =>
                  setRequestForm({
                    ...requestForm,
                    visit_id: event.target.value,
                  })
                }
              >
                <option value="">Pilih kunjungan</option>

                {visits.map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    {visit.code} - {getPatientName(visit.id)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Nama Pemeriksaan
              </label>

              <input
                required
                className={inputClass}
                placeholder="Contoh: Pemeriksaan Hemoglobin"
                value={requestForm.examination_name}
                onChange={(event) =>
                  setRequestForm({
                    ...requestForm,
                    examination_name: event.target.value,
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
                value={requestForm.tariff}
                onChange={(event) =>
                  setRequestForm({
                    ...requestForm,
                    tariff: event.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Catatan</label>

              <textarea
                rows={3}
                className={inputClass}
                value={requestForm.notes}
                onChange={(event) =>
                  setRequestForm({
                    ...requestForm,
                    notes: event.target.value,
                  })
                }
              />
            </div>

            {modalError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {modalError}
              </p>
            )}
          </form>
        </Modal>
      )}

      {/* =====================================
          MODAL INPUT RESULT VIA NODE.JS
      ===================================== */}

      {modal === "result" && (
        <Modal
          title={`Input Hasil - ${selected?.code || ""}`}
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Batal
              </button>

              <button
                type="submit"
                form="lab-result-form"
                disabled={saving}
                className={buttonClass}
              >
                {saving ? "Menyimpan..." : "Simpan Hasil"}
              </button>
            </>
          }
        >
          <form
            id="lab-result-form"
            onSubmit={saveResult}
            className="space-y-4"
          >
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-900">
                {selected?.examination_name}
              </p>

              <p className="mt-1 text-slate-500">
                Pasien: {getPatientName(selected?.visit_id)}
              </p>

              <p className="mt-1 text-slate-500">
                Hasil dikirim melalui integrasi Node.js.
              </p>
            </div>

            {[
              ["Nilai Hasil", "result_value", "Contoh: 13.5"],
              ["Satuan", "unit", "Contoh: g/dL"],
              ["Rentang Referensi", "reference_range", "Contoh: 12.0 - 16.0"],
            ].map(([label, field, placeholder]) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium">
                  {label}
                </label>

                <input
                  required={field === "result_value" || field === "unit"}
                  className={inputClass}
                  placeholder={placeholder}
                  value={resultForm[field]}
                  onChange={(event) =>
                    setResultForm({
                      ...resultForm,
                      [field]: event.target.value,
                    })
                  }
                />
              </div>
            ))}

            <div>
              <label className="mb-1 block text-sm font-medium">
                Catatan Hasil
              </label>

              <textarea
                rows={3}
                className={inputClass}
                value={resultForm.notes}
                onChange={(event) =>
                  setResultForm({
                    ...resultForm,
                    notes: event.target.value,
                  })
                }
              />
            </div>

            {modalError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {modalError}
              </p>
            )}
          </form>
        </Modal>
      )}

      {/* =====================================
          MODAL DETAIL LABORATORY
      ===================================== */}

      {modal === "detail" && (
        <Modal
          title={`Detail Laboratorium - ${selected?.code || ""}`}
          onClose={closeModal}
          footer={
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              Tutup
            </button>
          }
        >
          {detailLoading ? (
            <p className="text-sm text-slate-500">
              Memuat detail pemeriksaan...
            </p>
          ) : modalError ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {modalError}
            </p>
          ) : detail ? (
            <div className="space-y-5">
              {/* DETAIL INFORMATION */}
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-slate-500">Pasien</p>
                  <p className="font-medium text-slate-900">
                    {getPatientName(detail.visit_id)}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Pemeriksaan</p>
                  <p className="font-medium text-slate-900">
                    {detail.examination_name}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="font-medium text-slate-900">{detail.status}</p>
                </div>

                <div>
                  <p className="text-slate-500">Tarif</p>
                  <p className="font-medium text-slate-900">
                    {rupiah(detail.tariff)}
                  </p>
                </div>
              </div>

              {/* RESULTS */}
              <div>
                <h3 className="mb-3 font-semibold text-slate-900">
                  Hasil Pemeriksaan
                </h3>

                {detail.results?.length > 0 ? (
                  <div className="space-y-3">
                    {detail.results.map((result) => (
                      <div
                        key={result.id}
                        className="rounded-lg border border-slate-300 bg-slate-50 p-4"
                      >
                        <p className="text-2xl font-bold text-blue-700">
                          {result.result_value} {result.unit}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          Rentang referensi: {result.reference_range || "-"}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          {result.notes || "-"}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          Diperiksa: {formatDate(result.examined_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
                    Hasil pemeriksaan belum tersedia.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Detail pemeriksaan tidak tersedia.
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
