import { useEffect, useMemo, useState } from "react";
import AssetCard from "../components/AssetCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { fetchMarketSnapshot } from "../services/api.js";
import { normalizeAssetData } from "../utils/formatters.js";

const supportedAssets = ["SPY", "QQQ", "AAPL", "Gold", "Silver"];
const windows = ["7 days", "30 days", "year-to-date"];

function ComparePage() {
  const [snapshot, setSnapshot] = useState(null);
  const [firstAsset, setFirstAsset] = useState("SPY");
  const [secondAsset, setSecondAsset] = useState("Gold");
  const [selectedWindow, setSelectedWindow] = useState(windows[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSnapshot() {
      try {
        const data = await fetchMarketSnapshot();
        setSnapshot(data);
      } catch {
        setError("Unable to load comparison data.");
      } finally {
        setLoading(false);
      }
    }

    loadSnapshot();
  }, []);

  const comparedAssets = useMemo(() => {
    const assets = snapshot?.assets || {};

    return {
      first: normalizeAssetData(assets[firstAsset], selectedWindow),
      second: normalizeAssetData(assets[secondAsset], selectedWindow),
    };
  }, [firstAsset, secondAsset, selectedWindow, snapshot]);

  const winnerLabel = useMemo(() => {
    const firstChange = Number(comparedAssets.first?.resolvedChangePercent ?? Number.NEGATIVE_INFINITY);
    const secondChange = Number(comparedAssets.second?.resolvedChangePercent ?? Number.NEGATIVE_INFINITY);

    if (firstChange === secondChange) {
      return "Both assets are currently tied on change percentage.";
    }

    return firstChange > secondChange
      ? `${firstAsset} is currently leading ${secondAsset}.`
      : `${secondAsset} is currently leading ${firstAsset}.`;
  }, [comparedAssets, firstAsset, secondAsset]);

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
              updatedAt={snapshot?.updated_at}
              compact
            />
            <AssetCard
              assetName={secondAsset}
              assetData={comparedAssets.second}
              updatedAt={snapshot?.updated_at}
              compact
            />
          </div>

          <section className="insight-card">
            <p className="eyebrow">Winner / loser snapshot</p>
            <h2>{winnerLabel}</h2>
            <p>
              Compare view is educational only and uses the backend&apos;s supported
              live-asset change values rather than investment advice.
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
