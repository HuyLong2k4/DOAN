interface SpinnerProps {
  size?: number;
  label?: string;
}

export function Spinner({ size = 22, label }: SpinnerProps) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" style={{ width: size, height: size }} />
      {label ? <span className="spinner-label">{label}</span> : null}
    </div>
  );
}
