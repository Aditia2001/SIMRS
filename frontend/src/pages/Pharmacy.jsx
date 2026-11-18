import { useCallback, useEffect, useMemo, useState } from "react";
import { yiiApi } from "../api/client";

const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const EMPTY_MEDICINE = {
  code: "",
  name: "",
  unit: "",
  price: "",
  stock: "",
  is_active: true,
};

const EMPTY_ITEM = {
  medicine_id: "",
  dosage: "",
  frequency: "",
  quantity: 1,
};

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

const labelClass = "mb-1 block text-sm font-medium text-slate-700";

function getError(error) {
  const data = error?.response?.data;

  if (typeof data?.message === "string") return data.message;
  if (Array.isArray(data) && data.length) {
    return data.map((item) => item.message).join(", ");
  }

  return error?.message || "Terjadi kesalahan.";
}

function Modal({ title, onClose, children, footer, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
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
          <div className="flex justify-end gap-2 border-t px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Pharmacy() {
  const [tab, setTab] = useState("medicines");
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [medicineForm, setMedicineForm] = useState(EMPTY_MEDICINE);

  const [prescriptionForm, setPrescriptionForm] = useState({
    visit_id: "",
    items: [{ ...EMPTY_ITEM }],
  });

  const [prescriptionDetail, setPrescriptionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.all([
        yiiApi.get("/medicines"),
        yiiApi.get("/prescriptions"),
        yiiApi.get("/visits"),
        yiiApi.get("/patients"),
      ]);

      setMedicines(results[0].data.data || []);
      setPrescriptions(results[1].data.data || []);
      setVisits(results[2].data.data || []);
      setPatients(results[3].data.data || []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const patientMap = useMemo(
    () => Object.fromEntries(patients.map((p) => [p.id, p])),
    [patients],
  );

  const visitMap = useMemo(
    () => Object.fromEntries(visits.map((v) => [v.id, v])),
    [visits],
  );

  const medicineMap = useMemo(
    () => Object.fromEntries(medicines.map((m) => [m.id, m])),
    [medicines],
  );

  function patientName(visitId) {
    const visit = visitMap[visitId];
    return patientMap[visit?.patient_id]?.full_name || "-";
  }

  const filteredMedicines = useMemo(() => {
    const keyword = search.toLowerCase();

    return medicines.filter((m) =>
      [m.code, m.name, m.unit].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(keyword),
      ),
    );
  }, [medicines, search]);

  const filteredPrescriptions = useMemo(() => {
    const keyword = search.toLowerCase();

    return prescriptions.filter((p) => {
      const visit = visitMap[p.visit_id];

      return [p.code, p.status, visit?.code, patientName(p.visit_id)].some(
        (value) =>
          String(value || "")
            .toLowerCase()
            .includes(keyword),
      );
    });
  }, [prescriptions, search, visitMap, patientMap]);

  function changeTab(nextTab) {
    setTab(nextTab);
    setSearch("");
    setError("");
  }

  function openCreateMedicine() {
    setSelected(null);
    setMedicineForm({ ...EMPTY_MEDICINE });
    setModal("medicine");
  }

  function openEditMedicine(medicine) {
    setSelected(medicine);
    setMedicineForm({
      code: medicine.code || "",
      name: medicine.name || "",
      unit: medicine.unit || "",
      price: String(medicine.price ?? ""),
      stock: String(medicine.stock ?? ""),
      is_active: Boolean(medicine.is_active),
    });
    setModal("medicine");
  }

  async function saveMedicine(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        code: medicineForm.code.trim(),
        name: medicineForm.name.trim(),
        unit: medicineForm.unit.trim(),
        price: Number(medicineForm.price),
        stock: Number(medicineForm.stock),
        is_active: medicineForm.is_active,
      };

      if (!payload.code || !payload.name || !payload.unit) {
        throw new Error("Kode, nama, dan satuan obat wajib diisi.");
      }

      if (
        !Number.isFinite(payload.price) ||
        payload.price < 0 ||
        !Number.isInteger(payload.stock) ||
        payload.stock < 0
      ) {
        throw new Error("Harga dan stok harus berupa angka yang valid.");
      }

      if (selected) {
        await yiiApi.put(`/medicines/${selected.id}`, payload);
      } else {
        await yiiApi.post("/medicines", payload);
      }

      setModal(null);
      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteMedicine(medicine) {
    if (!window.confirm(`Yakin ingin menghapus obat "${medicine.name}"?`)) {
      return;
    }

    setError("");

    try {
      await yiiApi.delete(`/medicines/${medicine.id}`);
      await loadData();
    } catch (err) {
      setError(getError(err));
    }
  }

  function openCreatePrescription() {
    setPrescriptionForm({
      visit_id: "",
      items: [{ ...EMPTY_ITEM }],
    });
    setModal("prescription");
  }

  function updatePrescriptionItem(index, field, value) {
    setPrescriptionForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addPrescriptionItem() {
    setPrescriptionForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM }],
    }));
  }

  function removePrescriptionItem(index) {
    setPrescriptionForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  async function savePrescription(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        visit_id: prescriptionForm.visit_id,
        items: prescriptionForm.items.map((item) => ({
          medicine_id: item.medicine_id,
          dosage: item.dosage.trim(),
          frequency: item.frequency.trim(),
          quantity: Number(item.quantity),
        })),
      };

      if (!payload.visit_id) {
        throw new Error("Pilih kunjungan pasien.");
      }

      if (
        !payload.items.length ||
        payload.items.some(
          (item) =>
            !item.medicine_id ||
            !item.dosage ||
            !item.frequency ||
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0,
        )
      ) {
        throw new Error("Lengkapi seluruh detail obat pada resep.");
      }

      await yiiApi.post("/prescriptions", payload);

      setModal(null);
      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  async function openPrescriptionDetail(prescription) {
    setSelected(prescription);
    setPrescriptionDetail(null);
    setDetailLoading(true);
    setModal("detail");
    setError("");

    try {
      const response = await yiiApi.get(`/prescriptions/${prescription.id}`);
      setPrescriptionDetail(response.data.data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setDetailLoading(false);
    }
  }

  async function dispensePrescription(prescription) {
    if (
      !window.confirm(
        `Serahkan obat untuk resep ${prescription.code}? Stok obat akan berkurang.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await yiiApi.post(`/prescriptions/${prescription.id}/dispense`);

      setModal(null);
      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  const input = (label, field, type = "text", required = true) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        required={required}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        className={fieldClass}
        value={medicineForm[field]}
        onChange={(e) =>
          setMedicineForm((prev) => ({
            ...prev,
            [field]: e.target.value,
          }))
        }
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Farmasi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola persediaan obat dan resep pasien.
          </p>
        </div>

        <button
          onClick={
            tab === "medicines" ? openCreateMedicine : openCreatePrescription
          }
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {tab === "medicines" ? "+ Tambah Obat" : "+ Buat Resep"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b">
          <button
            onClick={() => changeTab("medicines")}
            className={`border-b-2 px-5 py-4 text-sm font-medium ${
              tab === "medicines"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500"
            }`}
          >
            Master Obat
          </button>

          <button
            onClick={() => changeTab("prescriptions")}
            className={`border-b-2 px-5 py-4 text-sm font-medium ${
              tab === "prescriptions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500"
            }`}
          >
            Resep Pasien
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b p-4">
          <input
            className={`${fieldClass} max-w-sm`}
            placeholder={
              tab === "medicines"
                ? "Cari kode atau nama obat..."
                : "Cari kode resep, kunjungan, atau pasien..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <span className="text-xs text-slate-500">
            {tab === "medicines"
              ? `${filteredMedicines.length} obat`
              : `${filteredPrescriptions.length} resep`}
          </span>
        </div>

        {error && !modal && (
          <div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          {tab === "medicines" ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    "No",
                    "Kode",
                    "Nama Obat",
                    "Satuan",
                    "Harga",
                    "Stok",
                    "Status",
                    "Aksi",
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredMedicines.map((medicine, index) => (
                  <tr key={medicine.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">{medicine.code}</td>
                    <td className="px-4 py-3">{medicine.name}</td>
                    <td className="px-4 py-3">{medicine.unit}</td>
                    <td className="px-4 py-3">{rupiah(medicine.price)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          Number(medicine.stock) <= 10
                            ? "font-semibold text-red-600"
                            : "text-slate-700"
                        }
                      >
                        {medicine.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          medicine.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {medicine.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        onClick={() => openEditMedicine(medicine)}
                        className="mr-3 font-medium text-amber-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMedicine(medicine)}
                        className="font-medium text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && filteredMedicines.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Tidak ada obat ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    "No",
                    "Kode Resep",
                    "Kode Kunjungan",
                    "Pasien",
                    "Status",
                    "Diserahkan Pada",
                    "Aksi",
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredPrescriptions.map((prescription, index) => (
                  <tr key={prescription.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">
                      {prescription.code}
                    </td>
                    <td className="px-4 py-3">
                      {visitMap[prescription.visit_id]?.code || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {patientName(prescription.visit_id)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          prescription.status === "DISPENSED"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {prescription.status === "DISPENSED"
                          ? "Diserahkan"
                          : "Menunggu"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {prescription.dispensed_at || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        onClick={() => openPrescriptionDetail(prescription)}
                        className="mr-3 font-medium text-blue-600 hover:underline"
                      >
                        Detail
                      </button>

                      {prescription.status === "PENDING" && (
                        <button
                          onClick={() => dispensePrescription(prescription)}
                          disabled={saving}
                          className="font-medium text-green-600 hover:underline disabled:opacity-50"
                        >
                          Serahkan Obat
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {!loading && filteredPrescriptions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Tidak ada resep ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {loading && (
            <div className="p-6 text-center text-sm text-slate-500">
              Memuat data...
            </div>
          )}
        </div>
      </div>

      {modal === "medicine" && (
        <Modal
          title={selected ? "Edit Obat" : "Tambah Obat"}
          onClose={() => setModal(null)}
          footer={
            <>
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                form="medicine-form"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Obat"}
              </button>
            </>
          }
        >
          <form
            id="medicine-form"
            onSubmit={saveMedicine}
            className="space-y-4"
          >
            {input("Kode Obat", "code")}
            {input("Nama Obat", "name")}
            {input("Satuan", "unit")}

            <div className="grid grid-cols-2 gap-3">
              {input("Harga (Rp)", "price", "number")}
              {input("Stok", "stock", "number")}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={medicineForm.is_active}
                onChange={(e) =>
                  setMedicineForm((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
              />
              Obat aktif
            </label>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </form>
        </Modal>
      )}

      {modal === "prescription" && (
        <Modal
          title="Buat Resep Pasien"
          wide
          onClose={() => setModal(null)}
          footer={
            <>
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                form="prescription-form"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Resep"}
              </button>
            </>
          }
        >
          <form
            id="prescription-form"
            onSubmit={savePrescription}
            className="space-y-5"
          >
            <div>
              <label className={labelClass}>Kunjungan Pasien</label>
              <select
                required
                className={fieldClass}
                value={prescriptionForm.visit_id}
                onChange={(e) =>
                  setPrescriptionForm((prev) => ({
                    ...prev,
                    visit_id: e.target.value,
                  }))
                }
              >
                <option value="">Pilih kunjungan</option>
                {visits.map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    {visit.code} - {patientName(visit.id)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Daftar Obat</h3>
              <button
                type="button"
                onClick={addPrescriptionItem}
                className="text-sm font-medium text-blue-600"
              >
                + Tambah Obat
              </button>
            </div>

            {prescriptionForm.items.map((item, index) => {
              const medicine = medicineMap[item.medicine_id];

              return (
                <div
                  key={index}
                  className="space-y-3 rounded-lg border bg-slate-50 p-4"
                >
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">
                      Obat #{index + 1}
                    </span>

                    {prescriptionForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePrescriptionItem(index)}
                        className="text-sm text-red-600"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Nama Obat</label>
                    <select
                      required
                      className={fieldClass}
                      value={item.medicine_id}
                      onChange={(e) =>
                        updatePrescriptionItem(
                          index,
                          "medicine_id",
                          e.target.value,
                        )
                      }
                    >
                      <option value="">Pilih obat</option>
                      {medicines
                        .filter((m) => m.is_active)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} - {rupiah(m.price)} (Stok: {m.stock})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className={labelClass}>Dosis</label>
                      <input
                        required
                        className={fieldClass}
                        placeholder="500 mg"
                        value={item.dosage}
                        onChange={(e) =>
                          updatePrescriptionItem(
                            index,
                            "dosage",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Frekuensi</label>
                      <input
                        required
                        className={fieldClass}
                        placeholder="3 kali sehari"
                        value={item.frequency}
                        onChange={(e) =>
                          updatePrescriptionItem(
                            index,
                            "frequency",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Jumlah</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        className={fieldClass}
                        value={item.quantity}
                        onChange={(e) =>
                          updatePrescriptionItem(
                            index,
                            "quantity",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  {medicine && (
                    <div className="text-right text-sm text-slate-600">
                      Subtotal estimasi:{" "}
                      <strong>
                        {rupiah(
                          Number(medicine.price) * Number(item.quantity || 0),
                        )}
                      </strong>
                    </div>
                  )}
                </div>
              );
            })}

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </form>
        </Modal>
      )}

      {modal === "detail" && (
        <Modal
          title={`Detail Resep ${selected?.code || ""}`}
          wide
          onClose={() => setModal(null)}
          footer={
            <>
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Tutup
              </button>

              {selected?.status === "PENDING" && (
                <button
                  disabled={saving}
                  onClick={() => dispensePrescription(selected)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Serahkan Obat
                </button>
              )}
            </>
          }
        >
          {detailLoading ? (
            <p className="text-sm text-slate-500">Memuat detail resep...</p>
          ) : prescriptionDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Kode Kunjungan</p>
                  <p className="font-medium">
                    {visitMap[prescriptionDetail.visit_id]?.code || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Pasien</p>
                  <p className="font-medium">
                    {patientName(prescriptionDetail.visit_id)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="font-medium">{prescriptionDetail.status}</p>
                </div>
                <div>
                  <p className="text-slate-500">Diserahkan Pada</p>
                  <p className="font-medium">
                    {prescriptionDetail.dispensed_at || "-"}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Obat", "Dosis", "Frekuensi", "Jumlah", "Subtotal"].map(
                        (heading) => (
                          <th key={heading} className="px-3 py-3 font-medium">
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(prescriptionDetail.items || []).map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-3">
                          {medicineMap[item.medicine_id]?.name ||
                            item.medicine_id}
                        </td>
                        <td className="px-3 py-3">{item.dosage}</td>
                        <td className="px-3 py-3">{item.frequency}</td>
                        <td className="px-3 py-3">{item.quantity}</td>
                        <td className="px-3 py-3">{rupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-right font-semibold">
                Total:{" "}
                {rupiah(
                  (prescriptionDetail.items || []).reduce(
                    (sum, item) => sum + Number(item.subtotal || 0),
                    0,
                  ),
                )}
              </p>
            </div>
          ) : (
            <p className="text-sm text-red-600">
              {error || "Detail resep tidak dapat dimuat."}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
