import { useEffect, useMemo, useState } from "react";
import { FiBarChart2, FiDownload, FiInfo, FiMail, FiTrendingUp, FiZap } from "react-icons/fi";
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
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

function printHtmlReport(title, bodyHtml) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  document.body.appendChild(iframe);

  const iframeWindow = iframe.contentWindow;
  const iframeDocument = iframeWindow?.document;

  if (!iframeWindow || !iframeDocument) {
    document.body.removeChild(iframe);
    return false;
  }

  iframeDocument.open();
  iframeDocument.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #132033; }
          h1 { margin-bottom: 8px; }
          p { line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #d8e0ea; padding: 12px; text-align: left; }
          th { background: #f6f8fb; }
          .meta { color: #4b5c72; margin-bottom: 20px; }
        </style>
      </head>
      <body>${bodyHtml}</body>
    </html>
  `);
  iframeDocument.close();

  window.setTimeout(() => {
    iframeWindow.focus();
    iframeWindow.print();
    window.setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 250);

  return true;
}

function DashboardPage() {
  const [selectedWindow, setSelectedWindow] = useState(windows[0]);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const windowCode = getWindowCode(selectedWindow);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const pieData = useMemo(
    () =>
      normalizedAssets.map(({ assetName, assetData }) => ({
        name: assetName,
        value: Number(assetData?.price) || 0,
        color:
          chartColors[assetName] ||
          (assetName === "Gold" ? "#f2c96d" : assetName === "Silver" ? "#cfd8e2" : "#84a1cc"),
      })),
    [normalizedAssets],
  );

  function openPrintableReport() {
    if (!snapshot) {
      return;
    }

    const rows = normalizedAssets
      .map(
        ({ assetName, assetData }) => `
          <tr>
            <td>${assetName}</td>
            <td>${formatCurrency(assetData?.price)}</td>
            <td>${assetData?.resolvedChangePercent >= 0 ? "+" : ""}${Number(
              assetData?.resolvedChangePercent || 0,
            ).toFixed(2)}%</td>
            <td>${assetData?.latest_trading_day || updatedAt || "N/A"}</td>
          </tr>`,
      )
      .join("");

    printHtmlReport(
      "InvestIQ Dashboard Report",
      `
        <h1>InvestIQ Dashboard Report</h1>
        <p class="meta">Window: ${selectedWindow} | Generated from the latest dashboard snapshot.</p>
        <p>This report summarizes the five tracked assets, including latest price, selected-window change, and last updated date.</p>
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Latest Price</th>
              <th>Change</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `,
    );
  }

  function emailReport() {
    if (!snapshot) {
      return;
    }

    const summary = normalizedAssets
      .map(
        ({ assetName, assetData }) =>
          `${assetName}: ${formatCurrency(assetData?.price)} (${assetData?.resolvedChangePercent >= 0 ? "+" : ""}${Number(
            assetData?.resolvedChangePercent || 0,
          ).toFixed(2)}%)`,
      )
      .join("\n");

    const subject = encodeURIComponent(`InvestIQ Dashboard Report - ${selectedWindow}`);
    const body = encodeURIComponent(
      `InvestIQ Dashboard Report\n\nWindow: ${selectedWindow}\nLast updated: ${updatedAt || "N/A"}\n\n${summary}\n\nThis report was exported from InvestIQ.`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="icon-heading">
            <span className="title-icon" aria-hidden="true">
              <FiTrendingUp />
            </span>
            <span>Market snapshot for your tracked assets</span>
          </h1>
        </div>

        <div className="page-actions">
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

          <div className="report-actions">
            <button type="button" className="report-action" onClick={openPrintableReport} disabled={!snapshot || loading}>
              <FiDownload aria-hidden="true" />
              <span>Export PDF</span>
            </button>
            <button type="button" className="report-action" onClick={emailReport} disabled={!snapshot || loading}>
              <FiMail aria-hidden="true" />
              <span>Email report</span>
            </button>
          </div>
        </div>
      </div>

      {!bannerDismissed ? (
        <section className="context-banner">
          <div>
            <strong className="icon-subtitle">
              <FiInfo aria-hidden="true" />
              <span>What am I looking at?</span>
            </strong>
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
            <strong className="icon-subtitle">
              <FiZap aria-hidden="true" />
              <span>AI Insight</span>
            </strong>
            <p>
              {"\u{1F4A1}"} Tip: AAPL is up +2.47% while Gold is flat. This
              often signals risk-on sentiment — investors prefer growth over
              safety.
            </p>
          </section>

          <div className="chart-grid">
            <section className="chart-card">
              <div className="chart-copy">
                <p className="eyebrow">Historical price chart</p>
                <h2 className="icon-heading small">
                  <span className="title-icon" aria-hidden="true">
                    <FiBarChart2 />
                  </span>
                  <span>SPY, QQQ, and AAPL over the selected window</span>
                </h2>
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

            <section className="chart-card">
              <div className="chart-copy">
                <p className="eyebrow">Price snapshot</p>
                <h2 className="icon-heading small">
                  <span className="title-icon" aria-hidden="true">
                    <FiBarChart2 />
                  </span>
                  <span>Latest price mix across tracked assets</span>
                </h2>
                <p>
                  This pie chart shows how the latest reported price levels are distributed across
                  the five assets InvestIQ tracks.
                </p>
              </div>

              <div className="chart-frame">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={104}
                      innerRadius={56}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        background: "#081a31",
                        border: "1px solid #32517c",
                        borderRadius: "14px",
                        color: "#f6f2e7",
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-legend-row" aria-label="Pie legend">
                {pieData.map((asset) => (
                  <div key={asset.name} className="chart-legend-item">
                    <span
                      className="chart-legend-dot"
                      style={{ backgroundColor: asset.color }}
                      aria-hidden="true"
                    />
                    <span>{asset.name}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default DashboardPage;
