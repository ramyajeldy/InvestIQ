const windowCodeMap = {
  "7 days": "7d",
  "30 days": "30d",
  "year-to-date": "ytd",
};

export function getWindowCode(windowLabel) {
  return windowCodeMap[windowLabel] || "7d";
}

export function formatCurrency(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatSignedPercent(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "N/A";
  }

  return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(2)}%`;
}

export function formatRelativeTime(dateString) {
  if (!dateString) {
    return "Unknown";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatChartDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function isOlderThanHours(dateString, hours) {
  if (!dateString) {
    return false;
  }

  const parsed = new Date(dateString);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return Date.now() - parsed.getTime() > hours * 60 * 60 * 1000;
}

export function normalizeAssetData(assetData = {}) {
  return {
    ...assetData,
    resolvedChangePercent: assetData?.change ?? assetData?.change_percent ?? null,
  };
}

function sortHistoryEntries(history = {}) {
  return Object.entries(history).sort((a, b) => new Date(a[0]) - new Date(b[0]));
}

function filterHistoryEntries(entries, windowCode) {
  if (windowCode === "7d") {
    return entries.slice(-7);
  }

  if (windowCode === "30d") {
    return entries.slice(-30);
  }

  if (windowCode === "ytd") {
    const latestDate = entries.length ? new Date(entries.at(-1)[0]) : null;
    const targetYear = latestDate && !Number.isNaN(latestDate.getTime())
      ? latestDate.getFullYear()
      : new Date().getFullYear();

    return entries.filter(([date]) => new Date(date).getFullYear() === targetYear);
  }

  return entries;
}

export function buildPriceHistorySeries(assets, assetNames, windowCode = "7d") {
  const filteredHistoryByAsset = {};
  const dates = new Set();

  assetNames.forEach((assetName) => {
    const sortedEntries = sortHistoryEntries(assets?.[assetName]?.history || {});
    const filteredEntries = filterHistoryEntries(sortedEntries, windowCode);

    filteredHistoryByAsset[assetName] = Object.fromEntries(filteredEntries);
    filteredEntries.forEach(([date]) => dates.add(date));
  });

  return Array.from(dates)
    .sort((a, b) => new Date(a) - new Date(b))
    .map((date) => {
      const row = {
        date,
        displayDate: formatChartDate(date),
      };

      assetNames.forEach((assetName) => {
        const value = filteredHistoryByAsset[assetName]?.[date];
        row[assetName] = value !== undefined ? Number(value) : null;
      });

      return row;
    });
}

export function buildNormalizedHistorySeries(assets, assetNames, windowCode = "7d") {
  const rawSeries = buildPriceHistorySeries(assets, assetNames, windowCode);
  const baselines = {};

  assetNames.forEach((assetName) => {
    const firstPoint = rawSeries.find((row) => Number.isFinite(row[assetName]));
    baselines[assetName] = firstPoint?.[assetName] ?? null;
  });

  return rawSeries.map((row) => {
    const normalizedRow = {
      date: row.date,
      displayDate: row.displayDate,
    };

    assetNames.forEach((assetName) => {
      const baseline = baselines[assetName];
      const value = row[assetName];
      normalizedRow[assetName] =
        Number.isFinite(value) && Number.isFinite(baseline) && baseline !== 0
          ? (value / baseline) * 100
          : null;
    });

    return normalizedRow;
  });
}
