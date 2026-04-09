import { useEffect, useMemo, useState } from "react";
import { FiAward, FiBarChart2, FiDownload, FiHelpCircle, FiInfo, FiMail, FiRepeat } from "react-icons/fi";
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
  buildNormalizedHistorySeries,
  formatSignedPercent,
  getWindowCode,
  normalizeAssetData,
} from "../utils/formatters.js";

const supportedAssets = ["SPY", "QQQ", "AAPL", "Gold", "Silver"];
const windows = ["7 days", "30 days", "year-to-date"];
const compareColors = ["#f2c96d", "#67d2ff"];
const assetTooltips = {
  SPY: "S&P 500 ETF — tracks 500 largest US companies",
  QQQ: "Nasdaq-100 ETF — tech-heavy, higher growth potential",
  AAPL: "Apple Inc — world's most valuable company",
  Gold: "Safe haven asset — rises during market uncertainty",
  Silver: "Industrial + precious metal — more volatile than gold",
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
          .card { border: 1px solid #d8e0ea; border-radius: 12px; padding: 16px; margin-top: 16px; }
          .label { color: #4b5c72; font-size: 14px; }
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

function ComparePage() {
  const [snapshot, setSnapshot] = useState(null);
  const [firstAsset, setFirstAsset] = useState("SPY");
  const [secondAsset, setSecondAsset] = useState("Gold");
  const [selectedWindow, setSelectedWindow] = useState(windows[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function loadSnapshot() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchMarketSnapshot(getWindowCode(selectedWindow));
        setSnapshot(data);
      } catch {
        setError("Unable to load comparison data.");
      } finally {
        setLoading(false);
      }
    }

    loadSnapshot();
  }, [selectedWindow]);

  const comparedAssets = useMemo(() => {
    const assets = snapshot?.assets || {};

    return {
      first: normalizeAssetData(assets[firstAsset]),
      second: normalizeAssetData(assets[secondAsset]),
    };
  }, [firstAsset, secondAsset, snapshot]);

  const winnerLabel = useMemo(() => {
    const firstChange = Number(
      comparedAssets.first?.resolvedChangePercent ?? Number.NEGATIVE_INFINITY,
    );
    const secondChange = Number(
      comparedAssets.second?.resolvedChangePercent ?? Number.NEGATIVE_INFINITY,
    );

    if (firstChange === secondChange) {
      return "Both assets are currently tied on change percentage.";
    }

    return firstChange > secondChange
      ? `${firstAsset} is currently leading ${secondAsset}.`
      : `${secondAsset} is currently leading ${firstAsset}.`;
  }, [comparedAssets, firstAsset, secondAsset]);

  const normalizedChartData = useMemo(
    () =>
      buildNormalizedHistorySeries(
        snapshot?.assets || {},
        [firstAsset, secondAsset],
        getWindowCode(selectedWindow),
      ),
    [firstAsset, secondAsset, selectedWindow, snapshot],
  );

  const winnerBadge = useMemo(() => {
    const firstLastPoint = [...normalizedChartData]
      .reverse()
      .find((row) => Number.isFinite(row[firstAsset]));
    const secondLastPoint = [...normalizedChartData]
      .reverse()
      .find((row) => Number.isFinite(row[secondAsset]));

    if (!firstLastPoint || !secondLastPoint) {
      return "Select two supported assets to see which one performed better in this window.";
    }

    const firstReturn = Number(firstLastPoint[firstAsset]) - 100;
    const secondReturn = Number(secondLastPoint[secondAsset]) - 100;
    const spread = Math.abs(firstReturn - secondReturn);

    if (Math.abs(spread) < 0.01) {
      return `Both assets performed about the same over ${selectedWindow.toLowerCase()}.`;
    }

    const winner = firstReturn > secondReturn ? firstAsset : secondAsset;
    const loser = winner === firstAsset ? secondAsset : firstAsset;

    return `\u{1F4C8} ${winner} outperformed ${loser} by ${formatSignedPercent(
      spread,
    )} in the last ${selectedWindow.toLowerCase()}`;
  }, [firstAsset, normalizedChartData, secondAsset, selectedWindow]);

  const comparePieData = useMemo(() => {
    const firstValue = Math.abs(Number(comparedAssets.first?.resolvedChangePercent) || 0);
    const secondValue = Math.abs(Number(comparedAssets.second?.resolvedChangePercent) || 0);

    return [
      { name: firstAsset, value: firstValue || 0.01, color: compareColors[0] },
      { name: secondAsset, value: secondValue || 0.01, color: compareColors[1] },
    ];
  }, [comparedAssets.first, comparedAssets.second, firstAsset, secondAsset]);

  function openPrintableReport() {
    if (!snapshot) {
      return;
    }

    printHtmlReport(
      "InvestIQ Compare Report",
      `
        <h1>InvestIQ Compare Report</h1>
        <p class="label">Window: ${selectedWindow}</p>
        <p>${winnerBadge}</p>
        <div class="card">
          <strong>${firstAsset}</strong>
          <p>Latest change: ${formatSignedPercent(comparedAssets.first?.resolvedChangePercent)}</p>
        </div>
        <div class="card">
          <strong>${secondAsset}</strong>
          <p>Latest change: ${formatSignedPercent(comparedAssets.second?.resolvedChangePercent)}</p>
        </div>
        <div class="card">
          <strong>How to read this</strong>
          <p>If one line stays above 100 and the other dips below, the higher one delivered better returns in this period.</p>
        </div>
      `,
    );
  }

  function emailReport() {
    if (!snapshot) {
      return;
    }

    const subject = encodeURIComponent(`InvestIQ Compare Report - ${firstAsset} vs ${secondAsset}`);
    const body = encodeURIComponent(
      `InvestIQ Compare Report\n\nWindow: ${selectedWindow}\n\n${winnerBadge}\n\n${firstAsset}: ${formatSignedPercent(
        comparedAssets.first?.resolvedChangePercent,
      )}\n${secondAsset}: ${formatSignedPercent(
        comparedAssets.second?.resolvedChangePercent,
      )}\n\nThis report was exported from InvestIQ.`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Compare</p>
          <h1 className="icon-heading">
            <span className="title-icon" aria-hidden="true">
              <FiRepeat />
            </span>
            <span>Compare two supported assets side by side</span>
          </h1>
        </div>

        <div className="page-actions">
          <div className="window-toggle" role="tablist" aria-label="Compare window selector">
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

      <section className="context-banner compare-guide">
        <div>
          <strong className="icon-subtitle">
            <FiInfo aria-hidden="true" />
            <span>How to use this</span>
          </strong>
          <p>
            Select two assets to compare their performance. The chart{" "}
            <Tooltip text="Normalization means both assets start at the same point (100) so you can compare growth rate, not raw price.">
              <span className="tooltip-term">normalizes</span>
            </Tooltip>{" "}
            both to 100 at the start so you can see which grew faster —
            regardless of their actual price.
          </p>
        </div>
      </section>

      <div className="compare-controls">
        <label>
          Compare this...
          <select value={firstAsset} onChange={(event) => setFirstAsset(event.target.value)}>
            {supportedAssets.map((asset) => (
              <option key={asset} value={asset}>
                {asset}
              </option>
            ))}
          </select>
        </label>

        <label>
          ...against this
          <select value={secondAsset} onChange={(event) => setSecondAsset(event.target.value)}>
            {supportedAssets.map((asset) => (
              <option key={asset} value={asset} disabled={asset === firstAsset}>
                {asset}
              </option>
            ))}
          </select>
        </label>

        <p className="compare-controls-hint">Try: SPY vs QQQ, or AAPL vs Gold</p>
      </div>

      {loading ? <LoadingSpinner label="Loading comparison view..." /> : null}
      {error ? <p className="error-banner">{error}</p> : null}

      {!loading && !error ? (
        <>
          <div className="compare-grid">
            <AssetCard
              assetName={firstAsset}
              assetData={comparedAssets.first}
              updatedAt={comparedAssets.first?.latest_trading_day || snapshot?.updated_at}
              compact
              tooltipText={assetTooltips[firstAsset]}
            />
            <AssetCard
              assetName={secondAsset}
              assetData={comparedAssets.second}
              updatedAt={comparedAssets.second?.latest_trading_day || snapshot?.updated_at}
              compact
              tooltipText={assetTooltips[secondAsset]}
            />
          </div>

          <div className="chart-grid">
            <section className="chart-card">
              <div className="chart-copy">
                <p className="eyebrow">Normalized performance chart</p>
                <h2 className="icon-heading small">
                  <span className="title-icon" aria-hidden="true">
                    <FiBarChart2 />
                  </span>
                  <span>Each series starts at 100 for fair comparison</span>
                </h2>
                <p>
                  The comparison chart uses backend history data and normalizes both assets to 100 at
                  the start of the selected window.
                </p>
              </div>

              <div className="winner-badge">{winnerBadge}</div>

              <div className="chart-frame">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={normalizedChartData}>
                    <CartesianGrid stroke="#25456f" strokeDasharray="3 3" />
                    <XAxis dataKey="displayDate" stroke="#98acc8" />
                    <YAxis stroke="#98acc8" domain={["auto", "auto"]} />
                    <RechartsTooltip
                      contentStyle={{
                        background: "#081a31",
                        border: "1px solid #32517c",
                        borderRadius: "14px",
                        color: "#f6f2e7",
                      }}
                      formatter={(value) =>
                        Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}` : "N/A"
                      }
                    />
                    {[firstAsset, secondAsset].map((assetName, index) => (
                      <Line
                        key={assetName}
                        type="monotone"
                        dataKey={assetName}
                        stroke={compareColors[index]}
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
                <p className="eyebrow">Change magnitude chart</p>
                <h2 className="icon-heading small">
                  <span className="title-icon" aria-hidden="true">
                    <FiBarChart2 />
                  </span>
                  <span>Window change split for selected assets</span>
                </h2>
                <p>
                  This pie chart compares the absolute size of each asset&apos;s percentage move over
                  the selected window.
                </p>
              </div>

              <div className="chart-frame">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={comparePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={104}
                      innerRadius={56}
                      paddingAngle={2}
                    >
                      {comparePieData.map((entry) => (
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
                      formatter={(value, name) =>
                        `${name}: ${Number(value).toFixed(2)} pts`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-legend-row" aria-label="Compare pie legend">
                {comparePieData.map((asset) => (
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

          <section className="insight-card">
            <p className="eyebrow">Winner / loser snapshot</p>
            <h2 className="icon-heading small">
              <span className="title-icon" aria-hidden="true">
                <FiAward />
              </span>
              <span>{winnerLabel}</span>
            </h2>
            <p>
              Winner and loser labels are based on the backend&apos;s <code>change</code> field for
              the selected window.
            </p>
          </section>

          <section className="insight-card">
            <p className="eyebrow">What does this mean?</p>
            <h2 className="icon-heading small">
              <span className="title-icon" aria-hidden="true">
                <FiHelpCircle />
              </span>
              <span>How to read the comparison chart</span>
            </h2>
            <p>
              If one line stays above 100 and the other dips below, the higher
              one delivered better returns in this period.
            </p>
          </section>

          <p className="page-disclaimer">
            InvestIQ provides educational information only, not financial advice.
          </p>
        </>
      ) : null}
    </section>
  );
}

export default ComparePage;
