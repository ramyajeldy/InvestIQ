import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AssetCard from "../components/AssetCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { fetchMarketSnapshot } from "../services/api.js";
import {
  buildPriceHistorySeries,
  formatCurrency,
  getWindowCode,
  isOlderThanHours,
  normalizeAssetData,
} from "../utils/formatters.js";

const windows = ["7 days", "30 days", "year-to-date"];
const chartAssets = ["SPY", "QQQ", "AAPL"];
const chartColors = {
  SPY: "#f2c96d",
  QQQ: "#67d2ff",
  AAPL: "#7bf0c6",
};

function DashboardPage() {
  const [selectedWindow, setSelectedWindow] = useState(windows[0]);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const windowCode = getWindowCode(selectedWindow);

  useEffect(() => {
    async function loadSnapshot() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchMarketSnapshot(windowCode);
        setSnapshot(data);
      } catch {
        setError("Unable to load market snapshot data.");
      } finally {
        setLoading(false);
      }
    }

    loadSnapshot();
  }, [windowCode]);

  const updatedAt = snapshot?.updated_at;
  const stale = isOlderThanHours(updatedAt, 48);

  const normalizedAssets = useMemo(() => {
    const assets = snapshot?.assets || {};

    return Object.entries(assets).map(([assetName, assetData]) => ({
      assetName,
      assetData: normalizeAssetData(assetData),
    }));
  }, [snapshot]);

  const chartData = useMemo(
    () => buildPriceHistorySeries(snapshot?.assets || {}, chartAssets, windowCode),
    [snapshot, windowCode],
  );

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
                updatedAt={assetData?.latest_trading_day || updatedAt}
                stale={stale}
              />
            ))}
          </div>

          <section className="chart-card">
            <div className="chart-copy">
              <p className="eyebrow">Historical price chart</p>
              <h2>SPY, QQQ, and AAPL over the selected window</h2>
              <p>
                The line chart uses the backend&apos;s <code>history</code> field to show actual
                asset prices across the selected time range, filtered to the current window.
              </p>
            </div>

            <div className="chart-frame">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#25456f" strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" stroke="#98acc8" />
                  <YAxis
                    stroke="#98acc8"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#081a31",
                      border: "1px solid #32517c",
                      borderRadius: "14px",
                      color: "#f6f2e7",
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  {chartAssets.map((assetName) => (
                    <Line
                      key={assetName}
                      type="monotone"
                      dataKey={assetName}
                      stroke={chartColors[assetName]}
                      strokeWidth={3}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default DashboardPage;
