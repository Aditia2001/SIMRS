import { useCallback, useEffect, useMemo, useState } from "react";
import { yiiApi } from "../api/client";

const INITIAL_FORM = {
  patient_id: "",
  polyclinic_id: "",
  doctor_id: "",
  visit_date: new Date().toLocaleDateString("en-CA"),
};

const STATUS_OPTIONS = [
  { value: "WAITING", label: "Menunggu" },
  { value: "IN_PROGRESS", label: "Sedang Diperiksa" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

const STATUS_STYLES = {
  WAITING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data?.message === "string") {
    return data.message;
  }

  if (Array.isArray(data)) {
    return data.map((item) => item.message).join(", ");
  }

  return error?.message || "Terjadi kesalahan.";
}

function getName(item, fields) {
  if (!item) return "-";

  for (const field of fields) {
    if (item[field]) return item[field];
  }

  return item.code || item.id || "-";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function Visits() {
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [polyclinics, setPolyclinics] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all([
        yiiApi.get("/visits"),
        yiiApi.get("/patients"),
        yiiApi.get("/polyclinics"),
        yiiApi.get("/medical-staff"),
      ]);

      setVisits(responses[0].data.data || []);
      setPatients(responses[1].data.data || []);
      setPolyclinics(responses[2].data.data || []);
      setDoctors(responses[3].data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const patientMap = useMemo(
    () => new Map(patients.map((item) => [item.id, item])),
    [patients],
  );

  const polyclinicMap = useMemo(
    () => new Map(polyclinics.map((item) => [item.id, item])),
    [polyclinics],
  );

  const doctorMap = useMemo(
    () => new Map(doctors.map((item) => [item.id, item])),
    [doctors],
  );

  function patientName(id) {
    return getName(patientMap.get(id), ["full_name", "name"]);
  }

  function polyclinicName(id) {
    return getName(polyclinicMap.get(id), ["name", "polyclinic_name"]);
  }

  function doctorName(id) {
    return getName(doctorMap.get(id), ["full_name", "name"]);
  }

  const filteredVisits = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return visits.filter((visit) => {
      if (statusFilter !== "ALL" && visit.status !== statusFilter) {
        return false;
      }

      const patient = patientMap.get(visit.patient_id);
      const polyclinic = polyclinicMap.get(visit.polyclinic_id);
      const doctor = doctorMap.get(visit.doctor_id);

      const searchable = [
        visit.code,
        visit.visit_date,
        visit.queue_number,
        patient?.full_name,
        patient?.medical_record_number,
        polyclinic?.name,
        doctor?.full_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [visits, search, statusFilter, patientMap, polyclinicMap, doctorMap]);

  function openCreateForm() {
    setForm({
      ...INITIAL_FORM,
      visit_date: new Date().toLocaleDateString("en-CA"),
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (
      !form.patient_id ||
      !form.polyclinic_id ||
      !form.doctor_id ||
      !form.visit_date
    ) {
      setError("Semua field kunjungan wajib diisi.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await yiiApi.post("/visits", form);

      setShowForm(false);
      setSuccess("Kunjungan berhasil didaftarkan.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(visit, newStatus) {
    if (visit.status === newStatus) return;

    const confirmed = window.confirm(
      `Ubah status kunjungan ${visit.code} menjadi ${newStatus}?`,
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await yiiApi.patch(`/visits/${visit.id}/status`, {
        status: newStatus,
      });

      setSuccess("Status kunjungan berhasil diperbarui.");
      await loadData();

      if (selectedVisit?.id === visit.id) {
        setSelectedVisit({
          ...selectedVisit,
          status: newStatus,
        });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kunjungan & Antrean
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola pendaftaran, antrean, dan status kunjungan pasien.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Kunjungan
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <input
            type="text"
            placeholder="Cari kode, pasien, dokter, atau poliklinik..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ALL">Semua Status</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <span className="whitespace-nowrap text-sm text-slate-500">
              {filteredVisits.length} kunjungan
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[
                  "No",
                  "Kode Kunjungan",
                  "Tanggal",
                  "No. Antrean",
                  "Pasien",
                  "Poliklinik",
                  "Dokter",
                  "Status",
                  "Aksi",
                ].map((header) => (
                  <th
                    key={header}
                    className="whitespace-nowrap px-4 py-3 font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Memuat data kunjungan...
                  </td>
                </tr>
              ) : filteredVisits.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Tidak ada kunjungan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredVisits.map((visit, index) => (
                  <tr key={visit.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{index + 1}</td>

                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {visit.code}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      {visit.visit_date}
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {visit.queue_number}
                    </td>

                    <td className="px-4 py-3">
                      {patientName(visit.patient_id)}
                    </td>

                    <td className="px-4 py-3">
                      {polyclinicName(visit.polyclinic_id)}
                    </td>

                    <td className="px-4 py-3">{doctorName(visit.doctor_id)}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_STYLES[visit.status] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {STATUS_OPTIONS.find(
                          (option) => option.value === visit.status,
                        )?.label || visit.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        onClick={() => setSelectedVisit(visit)}
                        className="mr-3 font-medium text-blue-600 hover:underline"
                      >
                        Detail
                      </button>

                      <select
                        aria-label={`Ubah status ${visit.code}`}
                        value={visit.status}
                        disabled={saving}
                        onChange={(event) =>
                          handleStatusChange(visit, event.target.value)
                        }
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Tambah Kunjungan</h2>

              <button
                onClick={() => setShowForm(false)}
                className="text-2xl text-slate-400 hover:text-slate-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Pasien</label>
                <select
                  required
                  value={form.patient_id}
                  onChange={(event) =>
                    setForm({ ...form, patient_id: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Pilih pasien</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.medical_record_number} - {patient.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Poliklinik
                </label>
                <select
                  required
                  value={form.polyclinic_id}
                  onChange={(event) =>
                    setForm({ ...form, polyclinic_id: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Pilih poliklinik</option>
                  {polyclinics.map((polyclinic) => (
                    <option key={polyclinic.id} value={polyclinic.id}>
                      {getName(polyclinic, ["name", "polyclinic_name"])}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Dokter</label>
                <select
                  required
                  value={form.doctor_id}
                  onChange={(event) =>
                    setForm({ ...form, doctor_id: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Pilih dokter</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {getName(doctor, ["full_name", "name"])}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tanggal Kunjungan
                </label>
                <input
                  required
                  type="date"
                  value={form.visit_date}
                  onChange={(event) =>
                    setForm({ ...form, visit_date: event.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Kunjungan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Detail Kunjungan</h2>

              <button
                onClick={() => setSelectedVisit(null)}
                className="text-2xl text-slate-400"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {[
                ["Kode Kunjungan", selectedVisit.code],
                ["Pasien", patientName(selectedVisit.patient_id)],
                ["Poliklinik", polyclinicName(selectedVisit.polyclinic_id)],
                ["Dokter", doctorName(selectedVisit.doctor_id)],
                ["Tanggal Kunjungan", selectedVisit.visit_date],
                ["Nomor Antrean", selectedVisit.queue_number],
                ["Status", selectedVisit.status],
                [
                  "Biaya Pendaftaran",
                  formatCurrency(selectedVisit.registration_fee),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b border-slate-100 py-2"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="text-right font-medium">{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedVisit(null)}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
