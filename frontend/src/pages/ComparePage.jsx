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

function ComparePage() {
  const [snapshot, setSnapshot] = useState(null);
  const [firstAsset, setFirstAsset] = useState("SPY");
  const [secondAsset, setSecondAsset] = useState("Gold");
  const [selectedWindow, setSelectedWindow] = useState(windows[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Compare</p>
          <h1>Compare two supported assets side by side</h1>
        </div>

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
      </div>

      <section className="context-banner compare-guide">
        <div>
          <strong>How to use this</strong>
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

          <section className="chart-card">
            <div className="chart-copy">
              <p className="eyebrow">Normalized performance chart</p>
              <h2>Each series starts at 100 for fair comparison</h2>
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

          <section className="insight-card">
            <p className="eyebrow">Winner / loser snapshot</p>
            <h2>{winnerLabel}</h2>
            <p>
              Winner and loser labels are based on the backend&apos;s <code>change</code> field for
              the selected window.
            </p>
          </section>

          <section className="insight-card">
            <p className="eyebrow">What does this mean?</p>
            <h2>How to read the comparison chart</h2>
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
