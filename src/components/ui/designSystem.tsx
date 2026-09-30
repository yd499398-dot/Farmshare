import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, ShieldCheck, Check } from 'lucide-react';

// ==========================================
// 1. BUTTONS
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px]',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[42px]',
    lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[48px]'
  };

  const variantClasses = {
    primary:
      'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm hover:shadow active:scale-[0.99] focus-visible:outline-emerald-600',
    secondary:
      'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 active:scale-[0.99] focus-visible:outline-emerald-600',
    outline:
      'bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 hover:border-stone-300 shadow-2xs active:scale-[0.99] focus-visible:outline-stone-500',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm active:scale-[0.99] focus-visible:outline-red-600',
    ghost:
      'bg-transparent hover:bg-stone-100 text-stone-700 hover:text-stone-900 active:scale-[0.99]',
    dark:
      'bg-stone-900 hover:bg-stone-800 text-white shadow-sm hover:shadow active:scale-[0.99] focus-visible:outline-stone-900'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

// ==========================================
// 2. BADGES & VERIFICATION TAGS
// ==========================================
export const VerificationBadge: React.FC<{ type?: 'owner' | 'listing' | 'trusted'; size?: 'sm' | 'md' }> = ({
  type = 'owner',
  size = 'sm'
}) => {
  const isSm = size === 'sm';
  const label = type === 'owner' ? 'Verified Owner' : type === 'listing' ? 'Verified Listing' : 'Trusted Provider';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-md ${
        isSm ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      } bg-emerald-50 text-emerald-800 border border-emerald-200/80`}
      title="Verified through government ID or farm asset verification"
    >
      <ShieldCheck size={isSm ? 12 : 14} className="text-emerald-600 shrink-0" />
      <span>{label}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{
  status: 'active' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed' | 'paid' | 'processing' | 'failed' | 'draft';
}> = ({ status }) => {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold',
    pending: 'bg-amber-50 text-amber-900 border-amber-200',
    processing: 'bg-purple-50 text-purple-900 border-purple-200',
    cancelled: 'bg-stone-100 text-stone-600 border-stone-200',
    disputed: 'bg-rose-50 text-rose-800 border-rose-200',
    paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    failed: 'bg-red-50 text-red-800 border-red-200',
    draft: 'bg-stone-100 text-stone-700 border-stone-200'
  };

  const label = status.replace('_', ' ').toUpperCase();

  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${styles[status] || styles.pending}`}>
      {label}
    </span>
  );
};

// ==========================================
// 3. SKELETON LOADERS
// ==========================================
export const ListingCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs animate-pulse">
      <div className="w-full h-48 bg-stone-200" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-stone-200 rounded w-1/3" />
          <div className="h-4 bg-stone-200 rounded w-1/4" />
        </div>
        <div className="h-5 bg-stone-200 rounded w-3/4" />
        <div className="h-4 bg-stone-200 rounded w-1/2" />
        <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
          <div className="h-6 bg-stone-200 rounded w-1/3" />
          <div className="h-8 bg-stone-200 rounded-xl w-1/3" />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. EMPTY STATE
// ==========================================
export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ title, description, actionText, onAction, icon }) => {
  return (
    <div className="bg-white border border-stone-200 border-dashed rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto">
      {icon ? (
        <div className="w-16 h-16 bg-stone-100 text-stone-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      ) : (
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Info size={32} />
        </div>
      )}
      <h3 className="text-xl font-bold text-stone-900 mb-2">{title}</h3>
      <p className="text-stone-500 text-sm leading-relaxed mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

// ==========================================
// 5. TOAST NOTIFICATION CONTAINER
// ==========================================
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

export const ToastNotification: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0">
      {toasts.map(toast => {
        const bgColors = {
          success: 'bg-emerald-900 text-white border-emerald-700',
          error: 'bg-red-900 text-white border-red-700',
          warning: 'bg-amber-900 text-white border-amber-700',
          info: 'bg-stone-900 text-white border-stone-700'
        };

        const icons = {
          success: <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />,
          error: <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />,
          warning: <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />,
          info: <Info size={18} className="text-stone-400 shrink-0 mt-0.5" />
        };

        return (
          <div
            key={toast.id}
            className={`p-4 rounded-xl border shadow-xl flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-2 ${bgColors[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 text-xs sm:text-sm">
              {toast.title && <div className="font-bold text-white mb-0.5">{toast.title}</div>}
              <div className="text-stone-200 leading-normal">{toast.message}</div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-stone-400 hover:text-white p-1 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
