function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(
      /\[(.+?)\]\((https?:\/\/.+?)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    );
}

function markdownToHtml(markdown) {
  const escaped = escapeHtml(markdown || "");
  const blocks = escaped.split(/\n\s*\n/);

  return blocks
    .map((block) => {
      const trimmed = block.trim();

      if (!trimmed) {
        return "";
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const items = trimmed
          .split("\n")
          .filter((line) => /^[*-]\s/.test(line.trim()))
          .map((line) => `<li>${formatInline(line.replace(/^[*-]\s/, "").trim())}</li>`)
          .join("");

        return `<ul>${items}</ul>`;
      }

      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed
          .split("\n")
          .filter((line) => /^\d+\.\s/.test(line.trim()))
          .map((line) => `<li>${formatInline(line.replace(/^\d+\.\s/, "").trim())}</li>`)
          .join("");

        return `<ol>${items}</ol>`;
      }

      if (trimmed.startsWith("### ")) {
        return `<h3>${formatInline(trimmed.slice(4))}</h3>`;
      }

      if (trimmed.startsWith("## ")) {
        return `<h2>${formatInline(trimmed.slice(3))}</h2>`;
      }

      if (trimmed.startsWith("# ")) {
        return `<h1>${formatInline(trimmed.slice(2))}</h1>`;
      }

      return `<p>${formatInline(trimmed.replace(/\n/g, "<br />"))}</p>`;
    })
    .join("");
}

function MarkdownContent({ content }) {
  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  );
}

export default MarkdownContent;
