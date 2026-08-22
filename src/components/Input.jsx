import React from "react";

export function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  error = null,
  placeholder,
  required = false,
  className = "",
  ...props
}) {
  const isTextarea = type === "textarea";

  return (
    <div className={lex flex-col gap-1.5 }>
      {label && (
        <label
          htmlFor={name}
          className="text-[12px] font-medium uppercase tracking-wider text-[#6B7268] dark:text-[#8A90AC]"
        >
          {label} {required && <span className="text-[#B3452E]">*</span>}
        </label>
      )}
      {isTextarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={w-full bg-white dark:bg-[#1A2036] text-[#1F2A24] dark:text-[#EDEFF7] border  rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4622D]/40 min-h-[100px]}
          {...props}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={w-full bg-white dark:bg-[#1A2036] text-[#1F2A24] dark:text-[#EDEFF7] border  rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4622D]/40}
          {...props}
        />
      )}
      {error && <span className="text-xs text-[#B3452E]">{error}</span>}
    </div>
  );
}
