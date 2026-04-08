function Tooltip({ text, children, className = "" }) {
  return (
    <span className={`tooltip-wrap ${className}`.trim()}>
      {children}
      <span className="tooltip-bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}

export default Tooltip;
