import ReactMarkdown from "react-markdown";

function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      className="markdown-content"
      components={{
        a: ({ ...props }) => (
          <a {...props} target="_blank" rel="noreferrer" />
        ),
      }}
    >
      {content || ""}
    </ReactMarkdown>
  );
}

export default MarkdownContent;
