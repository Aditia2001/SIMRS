import { useCallback, useEffect, useState } from "react";
import {
  Users,
  CalendarDays,
  Clock3,
  Activity,
  Receipt,
  FlaskConical,
  RefreshCw,
} from "lucide-react";
import { yiiApi, nodeApi } from "../api/client";

const jakartaDate = (value) => {
  if (!value) return "";

  const text = String(value);

  // DATE PostgreSQL: 2026-11-18
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  // Timestamp dengan timezone
  const normalized = text.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold mt-3 text-slate-900">
            {value ?? "—"}
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async (signal) => {
    setLoading(true);
    setErrors([]);

    const results = await Promise.allSettled([
      yiiApi.get("/patients", { signal }),
      yiiApi.get("/visits", { signal }),
      yiiApi.get("/billings", { signal }),
      nodeApi.get("/lab/requests", { signal }),
    ]);

    if (signal?.aborted) return;

    const names = [
      "Data pasien",
      "Data kunjungan",
      "Data tagihan",
      "Data laboratorium",
    ];

    const failures = [];
    const data = results.map((result, index) => {
      if (result.status === "rejected") {
        failures.push(`${names[index]} gagal dimuat.`);
        return null;
      }

      const rows = result.value?.data?.data;

      if (!Array.isArray(rows)) {
        failures.push(`${names[index]} memiliki format tidak valid.`);
        return null;
      }

      return rows;
    });

    const [patients, visits, billings, labs] = data;
    const today = jakartaDate(new Date());

    const todayVisits = visits?.filter(
      (visit) => jakartaDate(visit.visit_date) === today,
    );

    setStats({
      patients: patients?.length,
      visits: todayVisits?.length,
      waiting: todayVisits?.filter((visit) => visit.status === "WAITING")
        .length,
      inProgress: todayVisits?.filter((visit) => visit.status === "IN_PROGRESS")
        .length,
      unpaid: billings?.filter((billing) => billing.status !== "PAID").length,
      labs: labs?.filter((lab) => lab.status === "PENDING").length,
    });

    setErrors(failures);
    setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadDashboard(controller.signal);

    return () => controller.abort();
  }, [loadDashboard]);

  const cards = [
    {
      title: "Total Pasien",
      value: stats.patients,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Kunjungan Hari Ini",
      value: stats.visits,
      icon: CalendarDays,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      title: "Antrean Menunggu",
      value: stats.waiting,
      icon: Clock3,
      color: "bg-amber-100 text-amber-600",
    },
    {
      title: "Sedang Diperiksa",
      value: stats.inProgress,
      icon: Activity,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Tagihan Belum Lunas",
      value: stats.unpaid,
      icon: Receipt,
      color: "bg-red-100 text-red-600",
    },
    {
      title: "Lab Pending",
      value: stats.labs,
      icon: FlaskConical,
      color: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Ringkasan operasional rumah sakit.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {errors.join(" ")} Statistik terkait ditampilkan sebagai —.
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Memuat dashboard...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      )}
    </div>
  );
}
