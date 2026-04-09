import ReactMarkdown from "react-markdown";

function MarkdownContent({ content }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          a: ({ ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" />
          ),
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownContent;
