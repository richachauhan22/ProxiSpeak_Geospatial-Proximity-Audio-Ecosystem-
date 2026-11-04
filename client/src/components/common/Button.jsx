import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconRight: IconRight,
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all rounded-lg select-none outline-none';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  }[size] || 'px-4 py-2 text-sm gap-2';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`btn-modern btn-${variant} ${sizeClasses} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <span className="spinner-sm animate-spin mr-1.5">⏳</span>
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="shrink-0" />
      ) : null}
      <span>{children}</span>
      {IconRight && !isLoading && (
        <IconRight size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="shrink-0" />
      )}
    </button>
  );
}

export default Button;
