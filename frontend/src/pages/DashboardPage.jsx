import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import AssetCard from "../components/AssetCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Tooltip from "../components/Tooltip.jsx";
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
const assetTooltips = {
  SPY: "S&P 500 ETF — tracks 500 largest US companies",
  QQQ: "Nasdaq-100 ETF — tech-heavy, higher growth potential",
  AAPL: "Apple Inc — world's most valuable company",
  Gold: "Safe haven asset — rises during market uncertainty",
  Silver: "Industrial + precious metal — more volatile than gold",
};
const windowTooltips = {
  "7 days": "Shows price history for the past 7 trading days",
  "30 days": "Shows price history for the past 30 trading days",
  "year-to-date": "Shows performance since January 1st",
};

function DashboardPage() {
  const [selectedWindow, setSelectedWindow] = useState(windows[0]);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);
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
            <Tooltip key={window} text={windowTooltips[window]}>
              <button
                type="button"
                className={selectedWindow === window ? "active" : ""}
                onClick={() => setSelectedWindow(window)}
              >
                {window}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {!bannerDismissed ? (
        <section className="context-banner">
          <div>
            <strong>What am I looking at?</strong>
            <p>
              This dashboard shows live prices for the assets InvestIQ tracks.
              Prices update via our ETL pipeline which runs daily on weekdays.
              Use this to spot trends before asking InvestIQ deeper questions in
              Chat.
            </p>
          </div>
          <button
            type="button"
            className="context-banner-dismiss"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss dashboard guide"
          >
            Dismiss
          </button>
        </section>
      ) : null}

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
                tooltipText={assetTooltips[assetName]}
              />
            ))}
          </div>

          <section className="insight-strip">
            <strong>AI Insight</strong>
            <p>
              {"\u{1F4A1}"} Tip: AAPL is up +2.47% while Gold is flat. This
              often signals risk-on sentiment — investors prefer growth over
              safety.
            </p>
          </section>

          <section className="chart-card">
            <div className="chart-copy">
              <p className="eyebrow">Historical price chart</p>
              <h2>SPY, QQQ, and AAPL over the selected window</h2>
              <p>
                The line chart uses the backend&apos;s <code>history</code> field to show actual
                asset prices across the selected time range, filtered to the current window.
              </p>
            </div>

            <div className="chart-legend-row" aria-label="Chart legend">
              {chartAssets.map((assetName) => (
                <div key={assetName} className="chart-legend-item">
                  <span
                    className="chart-legend-dot"
                    style={{ backgroundColor: chartColors[assetName] }}
                    aria-hidden="true"
                  />
                  <span>{assetName}</span>
                </div>
              ))}
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
                  <RechartsTooltip
                    contentStyle={{
                      background: "#081a31",
                      border: "1px solid #32517c",
                      borderRadius: "14px",
                      color: "#f6f2e7",
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
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
