import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { yiiApi } from "../api/client";

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

const primaryButton =
  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";

const itemTypeLabel = {
  REGISTRATION: "Pendaftaran",
  ACTION: "Tindakan Medis",
  LAB: "Laboratorium",
  MEDICINE: "Obat",
};

const statusLabel = {
  UNPAID: "Belum Dibayar",
  PARTIAL: "Sebagian Dibayar",
  PAID: "Lunas",
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

function StatusBadge({ status }) {
  const colors = {
    UNPAID: "bg-red-100 text-red-700",
    PARTIAL: "bg-yellow-100 text-yellow-700",
    PAID: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
        colors[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {statusLabel[status] || status}
    </span>
  );
}

function Modal({ title, children, footer, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
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

export default function Finance() {
  const [tab, setTab] = useState("billings");

  const [billings, setBillings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const [visitId, setVisitId] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "CASH",
  });

  // Keep the same key when retrying an uncertain payment.
  const paymentKeyRef = useRef(null);

  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        yiiApi.get("/billings"),
        yiiApi.get("/payments"),
        yiiApi.get("/visits"),
        yiiApi.get("/patients"),
      ]);

      const [billingResult, paymentResult, visitResult, patientResult] =
        results;

      const errors = [];

      if (billingResult.status === "fulfilled") {
        setBillings(billingResult.value.data.data || []);
      } else {
        errors.push(`Tagihan: ${getError(billingResult.reason)}`);
      }

      if (paymentResult.status === "fulfilled") {
        setPayments(paymentResult.value.data.data || []);
      } else {
        errors.push(`Pembayaran: ${getError(paymentResult.reason)}`);
      }

      if (visitResult.status === "fulfilled") {
        setVisits(visitResult.value.data.data || []);
      } else {
        errors.push(`Kunjungan: ${getError(visitResult.reason)}`);
      }

      if (patientResult.status === "fulfilled") {
        setPatients(patientResult.value.data.data || []);
      } else {
        errors.push(`Pasien: ${getError(patientResult.reason)}`);
      }

      if (errors.length) {
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
    () => new Map(visits.map((item) => [item.id, item])),
    [visits],
  );

  const patientMap = useMemo(
    () => new Map(patients.map((item) => [item.id, item])),
    [patients],
  );

  const billingMap = useMemo(
    () => new Map(billings.map((item) => [item.id, item])),
    [billings],
  );

  function getVisitCode(visitId) {
    return visitMap.get(visitId)?.code || "-";
  }

  function getPatientName(visitId) {
    const visit = visitMap.get(visitId);
    const patient = patientMap.get(visit?.patient_id);

    return patient?.full_name || patient?.name || "-";
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  const stats = useMemo(() => {
    return billings.reduce(
      (acc, item) => {
        acc.total += Number(item.total_amount || 0);
        acc.paid += Number(item.paid_amount || 0);
        acc.remaining += Number(item.remaining_amount || 0);
        return acc;
      },
      { total: 0, paid: 0, remaining: 0 },
    );
  }, [billings]);

  // ==========================================
  // FILTER
  // ==========================================

  const filteredBillings = billings.filter((item) => {
    const keyword = search.toLowerCase().trim();

    const matchesSearch = [
      item.code,
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

  const filteredPayments = payments.filter((item) => {
    const billing = billingMap.get(item.billing_id);

    return [
      item.code,
      billing?.code,
      item.payment_method,
      billing ? getPatientName(billing.visit_id) : "",
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
    );
  });

  const availableVisits = visits.filter(
    (visit) => !billings.some((billing) => billing.visit_id === visit.id),
  );

  // ==========================================
  // MODAL HANDLERS
  // ==========================================

  function changeTab(value) {
    setTab(value);
    setSearch("");
    setStatusFilter("ALL");
    setSuccess("");
  }

  function closeModal() {
    if (saving) return;

    setModal(null);
    setSelected(null);
    setDetail(null);
    setModalError("");
    paymentKeyRef.current = null;
  }

  function openCreate() {
    setVisitId("");
    setModalError("");
    setModal("create");
  }

  async function openDetail(billing) {
    setSelected(billing);
    setDetail(null);
    setModalError("");
    setDetailLoading(true);
    setModal("detail");

    try {
      const response = await yiiApi.get(`/billings/${billing.id}`);
      setDetail(response.data.data);
    } catch (err) {
      setModalError(getError(err));
    } finally {
      setDetailLoading(false);
    }
  }

  function openPayment(billing) {
    if (Number(billing.remaining_amount) <= 0) return;

    setSelected(billing);
    setPaymentForm({
      amount: String(Number(billing.remaining_amount)),
      payment_method: "CASH",
    });
    paymentKeyRef.current = crypto.randomUUID();
    setModalError("");
    setModal("payment");
  }

  // ==========================================
  // CREATE BILLING
  // ==========================================

  async function createBilling(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setModalError("");

    try {
      if (!visitId) {
        throw new Error("Silakan pilih kunjungan pasien.");
      }

      await yiiApi.post("/billings", {
        visit_id: visitId,
      });

      setModal(null);
      setVisitId("");
      setSuccess("Tagihan berhasil dibuat.");

      await loadData();
    } catch (err) {
      setModalError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // PROCESS PAYMENT
  // ==========================================

  async function processPayment(event) {
    event.preventDefault();

    if (saving || !selected) return;

    setSaving(true);
    setModalError("");

    try {
      const amount = Number(paymentForm.amount);
      const remaining = Number(selected.remaining_amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Nominal pembayaran harus lebih dari 0.");
      }

      if (amount > remaining) {
        throw new Error(
          `Nominal pembayaran tidak boleh melebihi sisa tagihan ${rupiah(
            remaining,
          )}.`,
        );
      }

      const payload = {
        billing_id: selected.id,
        amount,
        payment_method: paymentForm.payment_method,
        idempotency_key: paymentKeyRef.current,
      };

      await yiiApi.post("/payments", payload);

      setModal(null);
      setSelected(null);
      paymentKeyRef.current = null;

      setSuccess("Pembayaran berhasil diproses.");
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
          <h1 className="text-2xl font-bold text-slate-900">Keuangan</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola tagihan, pembayaran, dan transaksi pasien.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className={secondaryButton}
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>

          {tab === "billings" && (
            <button
              type="button"
              onClick={openCreate}
              className={primaryButton}
            >
              + Buat Tagihan
            </button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Tagihan", value: stats.total },
          { label: "Pembayaran Diterima", value: stats.paid },
          { label: "Sisa Tagihan", value: stats.remaining },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {rupiah(stat.value)}
            </p>
          </div>
        ))}
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => changeTab("billings")}
            className={`border-b-2 px-5 py-4 text-sm font-medium ${
              tab === "billings"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500"
            }`}
          >
            Tagihan Pasien
          </button>

          <button
            type="button"
            onClick={() => changeTab("payments")}
            className={`border-b-2 px-5 py-4 text-sm font-medium ${
              tab === "payments"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500"
            }`}
          >
            Riwayat Pembayaran
          </button>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <input
            className={`${inputClass} max-w-sm`}
            placeholder={
              tab === "billings"
                ? "Cari kode tagihan, kunjungan, pasien..."
                : "Cari kode pembayaran, tagihan, pasien..."
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {tab === "billings" && (
            <select
              className="w-full max-w-[210px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">Semua Status</option>
              <option value="UNPAID">Belum Dibayar</option>
              <option value="PARTIAL">Sebagian Dibayar</option>
              <option value="PAID">Lunas</option>
            </select>
          )}
        </div>

        {/* BILLING TABLE */}
        {tab === "billings" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    "No",
                    "Kode Tagihan",
                    "Kunjungan",
                    "Pasien",
                    "Total",
                    "Dibayar",
                    "Sisa",
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
                    <td colSpan={9} className="p-8 text-center">
                      Memuat tagihan...
                    </td>
                  </tr>
                ) : filteredBillings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      Tidak ada tagihan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredBillings.map((billing, index) => (
                    <tr key={billing.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {billing.code}
                      </td>
                      <td className="px-4 py-3">
                        {getVisitCode(billing.visit_id)}
                      </td>
                      <td className="px-4 py-3">
                        {getPatientName(billing.visit_id)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {rupiah(billing.total_amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {rupiah(billing.paid_amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {rupiah(billing.remaining_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={billing.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openDetail(billing)}
                          className="mr-3 font-medium text-blue-600 hover:underline"
                        >
                          Detail
                        </button>

                        {Number(billing.remaining_amount) > 0 && (
                          <button
                            type="button"
                            onClick={() => openPayment(billing)}
                            className="font-medium text-green-600 hover:underline"
                          >
                            Bayar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAYMENT HISTORY TABLE */}
        {tab === "payments" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    "No",
                    "Kode Pembayaran",
                    "Kode Tagihan",
                    "Pasien",
                    "Nominal",
                    "Metode",
                    "Tanggal Pembayaran",
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
                    <td colSpan={7} className="p-8 text-center">
                      Memuat pembayaran...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Tidak ada pembayaran ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment, index) => {
                    const billing = billingMap.get(payment.billing_id);

                    return (
                      <tr key={payment.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {payment.code}
                        </td>
                        <td className="px-4 py-3">{billing?.code || "-"}</td>
                        <td className="px-4 py-3">
                          {billing ? getPatientName(billing.visit_id) : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {rupiah(payment.amount)}
                        </td>
                        <td className="px-4 py-3">
                          {payment.payment_method === "CASH"
                            ? "Tunai"
                            : "Non-Tunai"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatDate(payment.paid_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE BILLING MODAL */}
      {modal === "create" && (
        <Modal
          title="Buat Tagihan Pasien"
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className={secondaryButton}
              >
                Batal
              </button>
              <button
                type="submit"
                form="create-billing-form"
                disabled={saving}
                className={primaryButton}
              >
                {saving ? "Menyimpan..." : "Buat Tagihan"}
              </button>
            </>
          }
        >
          <form
            id="create-billing-form"
            onSubmit={createBilling}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Kunjungan Pasien
              </label>

              <select
                required
                className={inputClass}
                value={visitId}
                onChange={(event) => setVisitId(event.target.value)}
              >
                <option value="">Pilih kunjungan</option>

                {availableVisits.map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    {visit.code} - {getPatientName(visit.id)}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-slate-500">
                Hanya kunjungan yang belum memiliki tagihan yang ditampilkan.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              Tagihan akan dibuat berdasarkan komponen biaya yang dihitung oleh
              backend Yii2.
            </div>

            {modalError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {modalError}
              </p>
            )}
          </form>
        </Modal>
      )}

      {/* BILLING DETAIL MODAL */}
      {modal === "detail" && (
        <Modal
          title={`Detail Tagihan - ${selected?.code || ""}`}
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className={secondaryButton}
              >
                Tutup
              </button>

              {detail && Number(detail.remaining_amount) > 0 && (
                <button
                  type="button"
                  onClick={() => openPayment(detail)}
                  className={primaryButton}
                >
                  Bayar Tagihan
                </button>
              )}
            </>
          }
        >
          {detailLoading ? (
            <p className="text-sm text-slate-500">Memuat detail tagihan...</p>
          ) : modalError ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {modalError}
            </p>
          ) : detail ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Pasien</p>
                  <p className="font-medium">
                    {getPatientName(detail.visit_id)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Kunjungan</p>
                  <p className="font-medium">{getVisitCode(detail.visit_id)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <StatusBadge status={detail.status} />
                </div>
                <div>
                  <p className="text-slate-500">Dibuat</p>
                  <p className="font-medium">{formatDate(detail.created_at)}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold">Rincian Biaya</h3>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Jenis", "Deskripsi", "Qty", "Harga", "Subtotal"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className="whitespace-nowrap px-3 py-3"
                            >
                              {heading}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {(detail.items || []).map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-3">
                            {itemTypeLabel[item.item_type] || item.item_type}
                          </td>
                          <td className="px-3 py-3">{item.description}</td>
                          <td className="px-3 py-3">{item.quantity}</td>
                          <td className="whitespace-nowrap px-3 py-3">
                            {rupiah(item.unit_price)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            {rupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}

                      {!detail.items?.length && (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-4 text-center text-slate-500"
                          >
                            Tidak ada rincian biaya.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span>Total Tagihan</span>
                  <span className="font-semibold">
                    {rupiah(detail.total_amount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Sudah Dibayar</span>
                  <span className="font-semibold text-green-700">
                    {rupiah(detail.paid_amount)}
                  </span>
                </div>

                <div className="flex justify-between border-t pt-2">
                  <span className="font-bold">Sisa Tagihan</span>
                  <span className="font-bold text-blue-700">
                    {rupiah(detail.remaining_amount)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Detail tagihan tidak tersedia.
            </p>
          )}
        </Modal>
      )}

      {/* PAYMENT MODAL */}
      {modal === "payment" && (
        <Modal
          title={`Pembayaran - ${selected?.code || ""}`}
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className={secondaryButton}
              >
                Batal
              </button>

              <button
                type="submit"
                form="payment-form"
                disabled={saving}
                className={primaryButton}
              >
                {saving ? "Memproses..." : "Proses Pembayaran"}
              </button>
            </>
          }
        >
          <form
            id="payment-form"
            onSubmit={processPayment}
            className="space-y-4"
          >
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-semibold">
                {getPatientName(selected?.visit_id)}
              </p>
              <p className="mt-1 text-slate-500">
                Total Tagihan: {rupiah(selected?.total_amount)}
              </p>
              <p className="mt-1 text-slate-500">
                Sudah Dibayar: {rupiah(selected?.paid_amount)}
              </p>
              <p className="mt-2 font-bold text-blue-700">
                Sisa Tagihan: {rupiah(selected?.remaining_amount)}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Nominal Pembayaran (Rp)
              </label>

              <input
                required
                type="number"
                min="0.01"
                max={Number(selected?.remaining_amount || 0)}
                step="0.01"
                className={inputClass}
                value={paymentForm.amount}
                onChange={(event) => {
                  paymentKeyRef.current = crypto.randomUUID();
                  setPaymentForm({
                    ...paymentForm,
                    amount: event.target.value,
                  });
                }}
              />

              <p className="mt-1 text-xs text-slate-500">
                Pembayaran sebagian diperbolehkan.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Metode Pembayaran
              </label>

              <select
                className={inputClass}
                value={paymentForm.payment_method}
                onChange={(event) => {
                  paymentKeyRef.current = crypto.randomUUID();
                  setPaymentForm({
                    ...paymentForm,
                    payment_method: event.target.value,
                  });
                }}
              >
                <option value="CASH">Tunai</option>
                <option value="NON_CASH">Non-Tunai</option>
              </select>
            </div>

            {modalError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {modalError}
              </p>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
