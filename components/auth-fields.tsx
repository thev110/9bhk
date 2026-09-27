"use client";

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  error?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        className="ctrl"
        id={id}
        type="password"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="help">{error}</p> : null}
    </div>
  );
}

export function GoogleMark() {
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 11v2.8h4.6c-.2 1.2-1.4 3.5-4.6 3.5A5.3 5.3 0 0 1 6.7 12 5.3 5.3 0 0 1 12 6.7c1.5 0 2.5.6 3.1 1.2l2.1-2.1C15.8 4.5 14.1 3.7 12 3.7 7.4 3.7 3.7 7.4 3.7 12S7.4 20.3 12 20.3c4.8 0 8-3.4 8-8.1 0-.5 0-1-.1-1.2H12Z" />
    </svg>
  );
}
