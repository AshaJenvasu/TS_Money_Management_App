import React from "react";

interface InputFieldProps {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  iconId: string;
  error?: string;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export function InputField({
  type = "text",
  placeholder,
  value,
  onChange,
  iconId,
  error,
  isPassword = false,
  showPassword = false,
  onTogglePassword,
}: InputFieldProps) {
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="field" data-state={error ? "error" : ""}>
      <div className="control">
        <svg className="ic lead-ic">
          <use href={`#${iconId}`} />
        </svg>
        <input
          type={actualType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {isPassword && onTogglePassword && (
          <button type="button" className="eye" onClick={onTogglePassword}>
            <svg className="ic">
              <use href={showPassword ? "#i-eye-off" : "#i-eye"} />
            </svg>
          </button>
        )}
      </div>
      {error && (
        <p className="hint">
          <svg className="ic">
            <use href="#i-alert" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
