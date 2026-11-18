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
  // ส่งต่อให้ <input> เพื่อคุมพฤติกรรมคีย์บอร์ดมือถือ (เช่น ไม่ให้ auto-capitalize ตัวแรกของ email/username)
  autoCapitalize?: "none" | "off" | "on" | "sentences" | "words" | "characters";
  autoComplete?: string;
  autoCorrect?: "on" | "off";
  spellCheck?: boolean;
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
  autoCapitalize,
  autoComplete,
  autoCorrect,
  spellCheck,
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
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          spellCheck={spellCheck}
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
