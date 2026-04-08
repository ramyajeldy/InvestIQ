import {
  formatCurrency,
  formatRelativeTime,
  formatSignedPercent,
} from "../utils/formatters.js";
import Tooltip from "./Tooltip.jsx";

function AssetCard({
  assetName,
  assetData,
  updatedAt,
  stale,
  compact = false,
  tooltipText = "",
}) {
  const change = assetData?.resolvedChangePercent;
  const positive = Number(change) >= 0;

  return (
    <article className={`asset-card ${compact ? "compact" : ""}`}>
      <div className="asset-card-header">
        <div>
          <p className="eyebrow">Tracked asset</p>
          <h3>
            {tooltipText ? (
              <Tooltip text={tooltipText}>
                <span className="asset-name-trigger">{assetName}</span>
              </Tooltip>
            ) : (
              assetName
            )}
          </h3>
        </div>
        <span className={`pill ${positive ? "gain" : "loss"}`}>
          {formatSignedPercent(change)}
        </span>
      </div>

      <div className="asset-value">{formatCurrency(assetData?.price)}</div>

      <dl className="asset-meta">
        <div>
          <dt>Change</dt>
          <dd>{formatSignedPercent(change)}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatRelativeTime(updatedAt)}</dd>
        </div>
      </dl>

      {stale ? (
        <p className="inline-warning">Data may be stale. Snapshot is older than 48 hours.</p>
      ) : null}
    </article>
  );
}

export default AssetCard;
