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
  buildNormalizedHistorySeries,
  getWindowCode,
  normalizeAssetData,
} from "../utils/formatters.js";

const supportedAssets = ["SPY", "QQQ", "AAPL", "Gold", "Silver"];
const windows = ["7 days", "30 days", "year-to-date"];
const compareColors = ["#f2c96d", "#67d2ff"];

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
      buildNormalizedHistorySeries(snapshot?.assets || {}, [firstAsset, secondAsset]),
    [firstAsset, secondAsset, snapshot],
  );

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

      <div className="compare-controls">
        <label>
          First asset
          <select value={firstAsset} onChange={(event) => setFirstAsset(event.target.value)}>
            {supportedAssets.map((asset) => (
              <option key={asset} value={asset}>
                {asset}
              </option>
            ))}
          </select>
        </label>

        <label>
          Second asset
          <select value={secondAsset} onChange={(event) => setSecondAsset(event.target.value)}>
            {supportedAssets.map((asset) => (
              <option key={asset} value={asset} disabled={asset === firstAsset}>
                {asset}
              </option>
            ))}
          </select>
        </label>
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
            />
            <AssetCard
              assetName={secondAsset}
              assetData={comparedAssets.second}
              updatedAt={comparedAssets.second?.latest_trading_day || snapshot?.updated_at}
              compact
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

            <div className="chart-frame">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={normalizedChartData}>
                  <CartesianGrid stroke="#25456f" strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" stroke="#98acc8" />
                  <YAxis stroke="#98acc8" domain={["auto", "auto"]} />
                  <Tooltip
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
                  <Legend />
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

          <p className="page-disclaimer">
            InvestIQ provides educational information only, not financial advice.
          </p>
        </>
      ) : null}
    </section>
  );
}

export default ComparePage;
