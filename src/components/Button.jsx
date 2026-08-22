// Shared Button — see UI_SCHEMA.md section 5.
// One size only. Three variants: primary, secondary, danger.
// Don't add new variants/sizes here without updating UI_SCHEMA.md first.

export default function Button({
  variant = "primary",
  children,
  className = "",
  disabled = false,
  type = "button",
  ...props
}) {
  const base =
    "font-body text-body font-medium rounded-sm px-5 py-2.5 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-route text-white hover:bg-route/90",
    secondary:
      "bg-transparent border border-border text-ink hover:bg-border/30",
    danger: "bg-transparent text-danger hover:bg-danger/10",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
