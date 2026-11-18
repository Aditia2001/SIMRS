import { useEffect, useState } from "react";
import { yiiApi } from "../api/client";

const initialForm = {
  full_name: "",
  identity_number: "",
  gender: "MALE",
  birth_date: "",
  phone: "",
  address: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500";

function getErrorMessage(error) {
  const response = error.response?.data;

  if (response?.message) {
    return response.message;
  }

  if (response?.errors) {
    return Object.values(response.errors).flat().join(", ");
  }

  return error.message || "Terjadi kesalahan pada server.";
}

function genderLabel(gender) {
  if (gender === "MALE") return "Laki-laki";
  if (gender === "FEMALE") return "Perempuan";
  return gender || "-";
}

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [detail, setDetail] = useState(null);

  async function loadPatients() {
    setLoading(true);
    setError("");

    try {
      const response = await yiiApi.get("/patients");
      const data = response.data?.data;

      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function fetchPatients() {
      try {
        const response = await yiiApi.get("/patients");

        if (active) {
          setPatients(
            Array.isArray(response.data?.data) ? response.data.data : [],
          );
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchPatients();

    return () => {
      active = false;
    };
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const keyword = search.trim().toLowerCase();

    return [
      patient.full_name,
      patient.medical_record_number,
      patient.code,
      patient.identity_number,
      patient.phone,
    ].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(keyword),
    );
  });

  function openCreate() {
    setEditing(null);
    setForm({ ...initialForm });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(patient) {
    setEditing(patient);

    setForm({
      full_name: patient.full_name || "",
      identity_number: patient.identity_number || "",
      gender: patient.gender || "MALE",
      birth_date: patient.birth_date || "",
      phone: patient.phone || "",
      address: patient.address || "",
    });

    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditing(null);
    setFormError("");
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        full_name: form.full_name.trim(),
        identity_number: form.identity_number.trim(),
        gender: form.gender,
        birth_date: form.birth_date,
        phone: form.phone.trim(),
        address: form.address.trim(),
      };

      if (editing) {
        await yiiApi.put(`/patients/${editing.id}`, payload);
      } else {
        await yiiApi.post("/patients", payload);
      }

      setModalOpen(false);
      setEditing(null);
      setForm({ ...initialForm });

      await loadPatients();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Manajemen Pasien
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola data dan informasi pasien rumah sakit.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Pasien
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <input
            type="text"
            placeholder="Cari nama, nomor RM, NIK, atau telepon..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />

          <span className="text-sm text-slate-500">
            {filteredPatients.length} pasien
          </span>
        </div>

        {error && (
          <div className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}

            <button
              type="button"
              onClick={loadPatients}
              className="ml-3 font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[
                  "No",
                  "No. RM",
                  "Nama Pasien",
                  "Jenis Kelamin",
                  "Tanggal Lahir",
                  "Telepon",
                  "Aksi",
                ].map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap px-5 py-3 font-semibold"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Memuat data pasien...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Tidak ada pasien ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, index) => (
                  <tr key={patient.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">{index + 1}</td>

                    <td className="whitespace-nowrap px-5 py-4 font-medium">
                      {patient.medical_record_number || patient.code || "-"}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-900">
                      {patient.full_name || "-"}
                    </td>

                    <td className="px-5 py-4">{genderLabel(patient.gender)}</td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {patient.birth_date || "-"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {patient.phone || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setDetail(patient)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          Detail
                        </button>

                        <button
                          type="button"
                          onClick={() => openEdit(patient)}
                          className="font-medium text-amber-600 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-form-title"
            className="my-auto w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="patient-form-title"
                className="text-xl font-bold text-slate-900"
              >
                {editing ? "Edit Pasien" : "Tambah Pasien"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* NAMA */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Nama Pasien <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={updateField}
                  required
                  placeholder="Masukkan nama lengkap pasien"
                  className={inputClass}
                />
              </div>

              {/* NIK */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Nomor Identitas (NIK) <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  name="identity_number"
                  value={form.identity_number}
                  onChange={updateField}
                  maxLength={16}
                  required
                  placeholder="Masukkan 16 digit NIK"
                  className={inputClass}
                />
              </div>

              {/* GENDER & BIRTH DATE */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Jenis Kelamin
                  </label>

                  <select
                    name="gender"
                    value={form.gender}
                    onChange={updateField}
                    className={inputClass}
                  >
                    <option value="MALE">Laki-laki</option>
                    <option value="FEMALE">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    name="birth_date"
                    value={form.birth_date}
                    onChange={updateField}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Nomor Telepon
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  placeholder="Contoh: 081234567890"
                  className={inputClass}
                />
              </div>

              {/* ADDRESS */}
              <div>
                <label className="mb-1 block text-sm font-medium">Alamat</label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  rows={3}
                  placeholder="Masukkan alamat pasien"
                  className={inputClass}
                />
              </div>

              {/* ERROR */}
              {formError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              {/* ACTION */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : editing
                      ? "Simpan Perubahan"
                      : "Tambah Pasien"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-detail-title"
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="patient-detail-title"
                className="text-xl font-bold text-slate-900"
              >
                Detail Pasien
              </h2>

              <button
                type="button"
                onClick={() => setDetail(null)}
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {[
                ["Nomor RM", detail.medical_record_number || detail.code],
                ["Nama Pasien", detail.full_name],
                ["Nomor Identitas", detail.identity_number],
                ["Jenis Kelamin", genderLabel(detail.gender)],
                ["Tanggal Lahir", detail.birth_date],
                ["Telepon", detail.phone],
                ["Alamat", detail.address],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-3"
                >
                  <span className="text-slate-500">{label}</span>

                  <span className="col-span-2 font-medium text-slate-900">
                    {value || "-"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const patient = detail;
                  setDetail(null);
                  openEdit(patient);
                }}
                className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Edit Pasien
              </button>

              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
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
