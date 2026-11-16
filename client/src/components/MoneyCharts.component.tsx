import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { useMoney } from "../contexts/currency.context";
import { useTheme } from "../hooks";
import { tr } from "../i18n";
import { INCOME_COLOR, EXPENSE_COLOR } from "../assets/constants/transaction-colors";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
);

/** The chart look of Alice & Kevin Analytics: legend at the bottom, quiet grid. */
function useChartOptions() {
  const money = useMoney();
  const { theme } = useTheme();
  const light = theme === "light";
  return useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" as const },
      plugins: {
        legend: {
          position: "bottom" as const,
          align: "start" as const,
          labels: {
            color: light ? "#3c3c3c" : "#989797",
            boxWidth: 9,
            boxHeight: 9,
            padding: 18,
            usePointStyle: true,
            pointStyle: "circle" as const,
          },
        },
        tooltip: {
          backgroundColor: light ? "rgba(255,255,255,.97)" : "rgba(24,24,24,.97)",
          titleColor: light ? "#111111" : "#ffffff",
          bodyColor: light ? "#3c3c3c" : "#e5e5e5",
          borderColor: "rgba(50,205,50,.3)",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) =>
              `${context.dataset.label ? `${context.dataset.label}: ` : ""}${money(context.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: light ? "#737373" : "#989797", maxRotation: 0, maxTicksLimit: 8 },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: light ? "rgba(0,0,0,.055)" : "rgba(255,255,255,.055)" },
          ticks: {
            color: light ? "#737373" : "#989797",
            callback: (value: string | number) => money(Number(value)),
          },
        },
      },
    }),
    [light, money],
  );
}

/** Daily income and expenses of a month. */
export function DailyTrendChart({
  labels,
  income,
  expense,
}: {
  labels: string[];
  income: number[];
  expense: number[];
}) {
  useTranslation();
  const { theme } = useTheme();
  const options = useChartOptions() as ChartOptions<"line">;
  return (
    <Line
      role="img"
      aria-label={tr("Andamento giornaliero di entrate e spese")}
      options={options}
      data={{
        labels,
        datasets: [
          {
            label: tr("Spese"),
            data: expense,
            borderColor: EXPENSE_COLOR,
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            pointBackgroundColor: EXPENSE_COLOR,
            pointBorderColor: theme === "light" ? "#ffffff" : "#171717",
            pointBorderWidth: 2,
            pointRadius: labels.length > 24 ? 0 : 3,
            borderWidth: 2.5,
            tension: 0.38,
            fill: true,
          },
          {
            label: tr("Entrate"),
            data: income,
            borderColor: INCOME_COLOR,
            backgroundColor: "rgba(50, 205, 50, 0.1)",
            pointBackgroundColor: INCOME_COLOR,
            pointBorderColor: theme === "light" ? "#ffffff" : "#171717",
            pointBorderWidth: 2,
            pointRadius: labels.length > 24 ? 0 : 3,
            borderWidth: 2.5,
            tension: 0.38,
            fill: true,
          },
        ],
      }}
    />
  );
}

/** Monthly income and expenses of a year. */
export function MonthlyBarsChart({
  labels,
  income,
  expense,
}: {
  labels: string[];
  income: number[];
  expense: number[];
}) {
  useTranslation();
  const options = useChartOptions() as ChartOptions<"bar">;
  return (
    <Bar
      role="img"
      aria-label={tr("Andamento mensile di entrate e spese")}
      options={options}
      data={{
        labels,
        datasets: [
          {
            label: tr("Entrate"),
            data: income,
            backgroundColor: INCOME_COLOR,
            borderRadius: 7,
            borderSkipped: false,
          },
          {
            label: tr("Spese"),
            data: expense,
            backgroundColor: EXPENSE_COLOR,
            borderRadius: 7,
            borderSkipped: false,
          },
        ],
      }}
    />
  );
}
