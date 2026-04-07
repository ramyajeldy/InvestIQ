import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AssetCard from "../components/AssetCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { fetchMarketSnapshot } from "../services/api.js";
import { isOlderThanHours, normalizeAssetData } from "../utils/formatters.js";

const windows = ["7 days", "30 days", "year-to-date"];

function DashboardPage() {
  const [selectedWindow, setSelectedWindow] = useState(windows[0]);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSnapshot() {
      try {
        const data = await fetchMarketSnapshot();
        setSnapshot(data);
      } catch {
        setError("Unable to load market snapshot data.");
      } finally {
        setLoading(false);
      }
    }

    loadSnapshot();
  }, []);

  const updatedAt = snapshot?.updated_at;
  const stale = isOlderThanHours(updatedAt, 48);

  const normalizedAssets = useMemo(() => {
    const assets = snapshot?.assets || {};

    return Object.entries(assets).map(([assetName, assetData]) => ({
      assetName,
      assetData: normalizeAssetData(assetData, selectedWindow),
    }));
  }, [selectedWindow, snapshot]);

  const chartData = normalizedAssets.map(({ assetName, assetData }) => ({
    assetName,
    change: Number(assetData?.resolvedChangePercent || 0),
  }));

  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Market snapshot for your tracked assets</h1>
        </div>

        <div className="window-toggle" role="tablist" aria-label="Time window selector">
          {windows.map((window) => (
            <button
              key={window}
              type="button"
              className={selectedWindow === window ? "active" : ""}
              onClick={() => setSelectedWindow(window)}
            >
              {window}
            </button>
          ))}
        </div>
      </div>

      {stale ? (
        <div className="warning-banner">
          Market snapshot is older than 48 hours. Review the last updated timestamps before using it.
        </div>
      ) : null}

      {loading ? <LoadingSpinner label="Loading market dashboard..." /> : null}
      {error ? <p className="error-banner">{error}</p> : null}

      {!loading && !error ? (
        <>
          <div className="asset-grid">
            {normalizedAssets.map(({ assetName, assetData }) => (
              <AssetCard
                key={assetName}
                assetName={assetName}
                assetData={assetData}
                updatedAt={updatedAt}
                stale={stale}
              />
            ))}
          </div>

          <section className="chart-card">
            <div className="chart-copy">
              <p className="eyebrow">Performance overview</p>
              <h2>Change percentage across the selected window</h2>
              <p>
                This view compares the current backend change values across your
                five supported assets for the selected window.
              </p>
            </div>

            <div className="chart-frame">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="dashboardFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f2c96d" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#f2c96d" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#25456f" strokeDasharray="3 3" />
                  <XAxis dataKey="assetName" stroke="#98acc8" />
                  <YAxis stroke="#98acc8" />
                  <Tooltip
                    contentStyle={{
                      background: "#081a31",
                      border: "1px solid #32517c",
                      borderRadius: "14px",
                      color: "#f6f2e7",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="change"
                    stroke="#f2c96d"
                    strokeWidth={3}
                    fill="url(#dashboardFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default DashboardPage;
