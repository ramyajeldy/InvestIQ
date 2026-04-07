const windowKeyMap = {
  "7 days": ["change_percent_7d", "change_7d", "seven_day_change_percent", "weekly_change_percent"],
  "30 days": ["change_percent_30d", "change_30d", "thirty_day_change_percent", "monthly_change_percent"],
  "year-to-date": ["change_percent_ytd", "change_ytd", "ytd_change_percent"],
};

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

export function normalizeAssetData(assetData = {}, windowLabel = "7 days") {
  const candidateKeys = windowKeyMap[windowLabel] || [];
  const resolvedKey = candidateKeys.find((key) => assetData?.[key] !== undefined);

  return {
    ...assetData,
    resolvedChangePercent:
      assetData?.[resolvedKey] ??
      assetData?.change_percent ??
      assetData?.change ??
      null,
  };
}
