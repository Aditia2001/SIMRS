import { useCallback, useEffect, useMemo, useState } from "react";
import { yiiApi } from "../api/client";

const EMPTY_FORM = {
  visit_id: "",
  chief_complaint: "",
  anamnesis: "",
  blood_pressure: "",
  heart_rate: "",
  respiratory_rate: "",
  temperature: "",
  oxygen_saturation: "",
  weight: "",
  height: "",
  physical_examination: "",
  primary_diagnosis: "",
  secondary_diagnosis: "",
};

const FIELDS = [
  { name: "chief_complaint", label: "Keluhan Utama", type: "textarea" },
  { name: "anamnesis", label: "Anamnesis", type: "textarea" },
  { name: "blood_pressure", label: "Tekanan Darah (mmHg)" },
  { name: "heart_rate", label: "Detak Jantung (bpm)", type: "number" },
  {
    name: "respiratory_rate",
    label: "Frekuensi Napas (/menit)",
    type: "number",
  },
  {
    name: "temperature",
    label: "Suhu Tubuh (°C)",
    type: "number",
    step: "0.1",
  },
  { name: "oxygen_saturation", label: "Saturasi Oksigen (%)", type: "number" },
  { name: "weight", label: "Berat Badan (kg)", type: "number", step: "0.01" },
  { name: "height", label: "Tinggi Badan (cm)", type: "number", step: "0.01" },
  {
    name: "physical_examination",
    label: "Pemeriksaan Fisik",
    type: "textarea",
  },
  {
    name: "primary_diagnosis",
    label: "Diagnosis Utama",
    type: "textarea",
  },
  {
    name: "secondary_diagnosis",
    label: "Diagnosis Sekunder",
    type: "textarea",
  },
];

const NUMERIC_FIELDS = [
  "heart_rate",
  "respiratory_rate",
  "temperature",
  "oxygen_saturation",
  "weight",
  "height",
];

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data?.message === "string") return data.message;

  if (Array.isArray(data)) {
    return data.map((item) => item.message).join(", ");
  }

  return error?.message || "Terjadi kesalahan.";
}

function formatValue(value) {
  return value === null || value === undefined || value === ""
    ? "-"
    : String(value);
}

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [form, setForm] = useState({ ...EMPTY_FORM });

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [recordsResponse, visitsResponse, patientsResponse] =
        await Promise.all([
          yiiApi.get("/medical-records"),
          yiiApi.get("/visits"),
          yiiApi.get("/patients"),
        ]);

      setRecords(recordsResponse.data.data || []);
      setVisits(visitsResponse.data.data || []);
      setPatients(patientsResponse.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visitMap = useMemo(
    () => new Map(visits.map((visit) => [visit.id, visit])),
    [visits],
  );

  const patientMap = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient])),
    [patients],
  );

  function getPatientByVisit(visitId) {
    const visit = visitMap.get(visitId);
    return visit ? patientMap.get(visit.patient_id) : null;
  }

  function getPatientName(visitId) {
    return getPatientByVisit(visitId)?.full_name || "-";
  }

  function getVisitCode(visitId) {
    return visitMap.get(visitId)?.code || visitId;
  }

  const filteredRecords = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return records.filter((record) => {
      const visit = visitMap.get(record.visit_id);
      const patient = visit ? patientMap.get(visit.patient_id) : null;

      return [
        record.code,
        record.chief_complaint,
        record.primary_diagnosis,
        record.secondary_diagnosis,
        visit?.code,
        patient?.full_name,
        patient?.medical_record_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [records, search, visitMap, patientMap]);

  const availableVisits = useMemo(() => {
    const usedVisitIds = new Set(records.map((record) => record.visit_id));

    return visits.filter((visit) => !usedVisitIds.has(visit.id));
  }, [visits, records]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditingRecord(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEdit(record) {
    const nextForm = {};

    for (const key of Object.keys(EMPTY_FORM)) {
      nextForm[key] = record[key] ?? "";
    }

    setForm(nextForm);
    setEditingRecord(record);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function buildPayload() {
    const payload = {
      ...form,
      secondary_diagnosis: form.secondary_diagnosis.trim() || null,
    };

    for (const field of NUMERIC_FIELDS) {
      payload[field] =
        form[field] === "" || form[field] === null ? null : Number(form[field]);
    }

    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.visit_id) {
      setError("Kunjungan wajib dipilih.");
      return;
    }

    if (!form.chief_complaint.trim()) {
      setError("Keluhan utama wajib diisi.");
      return;
    }

    if (!form.primary_diagnosis.trim()) {
      setError("Diagnosis utama wajib diisi.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = buildPayload();

      if (editingRecord) {
        await yiiApi.put(`/medical-records/${editingRecord.id}`, payload);

        setSuccess("Rekam medis berhasil diperbarui.");
      } else {
        await yiiApi.post("/medical-records", payload);
        setSuccess("Rekam medis berhasil ditambahkan.");
      }

      setShowForm(false);
      setEditingRecord(null);

      await loadData();
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
          <h1 className="text-2xl font-bold text-slate-900">Rekam Medis</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola riwayat pemeriksaan dan diagnosis pasien.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Rekam Medis
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
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari pasien, kode RM, atau diagnosis..."
            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />

          <span className="text-sm text-slate-500">
            {filteredRecords.length} rekam medis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[
                  "No",
                  "Kode Rekam Medis",
                  "Kode Kunjungan",
                  "Nama Pasien",
                  "Keluhan Utama",
                  "Diagnosis Utama",
                  "Suhu",
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
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Memuat data rekam medis...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Tidak ada rekam medis ditemukan.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{index + 1}</td>

                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {record.code}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      {getVisitCode(record.visit_id)}
                    </td>

                    <td className="px-4 py-3">
                      {getPatientName(record.visit_id)}
                    </td>

                    <td className="max-w-52 truncate px-4 py-3">
                      {formatValue(record.chief_complaint)}
                    </td>

                    <td className="max-w-60 truncate px-4 py-3">
                      {formatValue(record.primary_diagnosis)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      {record.temperature != null
                        ? `${record.temperature} °C`
                        : "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="mr-3 font-medium text-blue-600 hover:underline"
                      >
                        Detail
                      </button>

                      <button
                        onClick={() => openEdit(record)}
                        className="font-medium text-orange-600 hover:underline"
                      >
                        Edit
                      </button>
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
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold">
                {editingRecord ? "Edit Rekam Medis" : "Tambah Rekam Medis"}
              </h2>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-2xl text-slate-400 hover:text-slate-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-6">
              <div className="mb-5">
                <label className="mb-1 block text-sm font-medium">
                  Kunjungan Pasien
                </label>

                <select
                  required
                  disabled={Boolean(editingRecord)}
                  value={form.visit_id}
                  onChange={(event) =>
                    updateField("visit_id", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Pilih kunjungan pasien</option>

                  {editingRecord ? (
                    <option value={editingRecord.visit_id}>
                      {getVisitCode(editingRecord.visit_id)} -{" "}
                      {getPatientName(editingRecord.visit_id)}
                    </option>
                  ) : (
                    availableVisits.map((visit) => (
                      <option key={visit.id} value={visit.id}>
                        {visit.code} - {getPatientName(visit.id)} (
                        {visit.visit_date})
                      </option>
                    ))
                  )}
                </select>

                {!editingRecord && availableVisits.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Tidak ada kunjungan yang tersedia.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {FIELDS.map((field) => {
                  const isTextarea = field.type === "textarea";

                  return (
                    <div
                      key={field.name}
                      className={isTextarea ? "md:col-span-2" : ""}
                    >
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        {field.label}
                      </label>

                      {isTextarea ? (
                        <textarea
                          rows={3}
                          value={form[field.name]}
                          onChange={(event) =>
                            updateField(field.name, event.target.value)
                          }
                          className={inputClass}
                        />
                      ) : (
                        <input
                          type={field.type || "text"}
                          step={field.step || undefined}
                          value={form[field.name]}
                          onChange={(event) =>
                            updateField(field.name, event.target.value)
                          }
                          className={inputClass}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-5">
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
                  {saving
                    ? "Menyimpan..."
                    : editingRecord
                      ? "Simpan Perubahan"
                      : "Simpan Rekam Medis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-bold">Detail Rekam Medis</h2>
                <p className="text-sm text-slate-500">{selectedRecord.code}</p>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="text-2xl text-slate-400"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto p-6 text-sm">
              {[
                ["Kode Kunjungan", getVisitCode(selectedRecord.visit_id)],
                ["Nama Pasien", getPatientName(selectedRecord.visit_id)],
                ...FIELDS.map((field) => [
                  field.label,
                  formatValue(selectedRecord[field.name]),
                ]),
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-2 gap-4 border-b border-slate-100 py-2"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="whitespace-pre-wrap font-medium">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t p-4">
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
