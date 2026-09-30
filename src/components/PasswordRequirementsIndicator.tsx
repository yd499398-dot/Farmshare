import React from 'react';
import { Check, X } from 'lucide-react';
import { validateStrongPassword, PasswordValidationResult } from '../lib/manualAuth';

interface PasswordRequirementsIndicatorProps {
  password: string;
  showAlways?: boolean;
}

export const PasswordRequirementsIndicator: React.FC<PasswordRequirementsIndicatorProps> = ({
  password,
  showAlways = false
}) => {
  if (!password && !showAlways) return null;

  const result: PasswordValidationResult = validateStrongPassword(password);

  const criteria = [
    { label: 'Uppercase letter (A-Z)', met: result.hasUpper },
    { label: 'Lowercase letter (a-z)', met: result.hasLower },
    { label: 'Number (0-9)', met: result.hasNumber },
    { label: 'Special symbol (!@#$%^&*)', met: result.hasSpecial },
    { label: '8+ Characters minimum', met: result.hasMinLength },
  ];

  // Strength label & color
  const strengthConfig = [
    { label: 'Too Weak', color: 'bg-red-500', textColor: 'text-red-700', width: 'w-1/5' },
    { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-700', width: 'w-2/5' },
    { label: 'Moderate', color: 'bg-amber-500', textColor: 'text-amber-700', width: 'w-3/5' },
    { label: 'Almost Strong', color: 'bg-lime-500', textColor: 'text-lime-700', width: 'w-4/5' },
    { label: 'Strong & Secure ✓', color: 'bg-green-600', textColor: 'text-green-700', width: 'w-full' },
  ];

  const currentStrength = result.score > 0 ? strengthConfig[result.score - 1] : strengthConfig[0];

  return (
    <div className="mt-2.5 p-3 bg-stone-50/90 border border-stone-200/90 rounded-xl space-y-2 text-left">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-stone-600">Password Strength:</span>
        <span className={`font-bold ${currentStrength.textColor}`}>
          {password ? currentStrength.label : 'Required'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${currentStrength.color}`}
          style={{ width: `${(result.score / 5) * 100}%` }}
        />
      </div>

      {/* Compulsory Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {criteria.map((item, idx) => (
          <div 
            key={idx} 
            className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
              item.met ? 'text-green-700' : 'text-stone-400'
            }`}
          >
            <div 
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] ${
                item.met 
                  ? 'bg-green-600 text-white' 
                  : 'border border-stone-300 text-transparent'
              }`}
            >
              {item.met ? <Check size={10} strokeWidth={3} /> : null}
            </div>
            <span className={item.met ? 'font-semibold' : ''}>{item.label}</span>
          </div>
        ))}
      </div>

      {!result.isValid && password && (
        <p className="text-[10px] text-amber-700 font-medium pt-0.5">
          ⚠️ All uppercase, lowercase, numbers, and special symbols are compulsory.
        </p>
      )}
    </div>
  );
};
