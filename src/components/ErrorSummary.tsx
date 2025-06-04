import React from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorSummaryProps {
  errors: string[];
  title?: string;
  onErrorClick?: (index: number) => void;
}

/**
 * ErrorSummary component displays a list of validation errors
 * with a collapsible UI and the ability to navigate to erroneous fields
 */
export function ErrorSummary({ errors, title = "Form Errors", onErrorClick }: ErrorSummaryProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (errors.length === 0) return null;

  return (
    <div 
      className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6" 
      role="alert" 
      aria-labelledby="error-summary-title"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h3 
            id="error-summary-title" 
            className="text-sm font-medium text-red-800"
          >
            {title}
          </h3>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="text-red-700 hover:text-red-900"
          aria-expanded={isExpanded}
          aria-controls="error-list"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {isExpanded && (
        <ul 
          id="error-list" 
          className="mt-2 pl-6 list-disc text-sm text-red-700 space-y-1"
        >
          {errors.map((error, index) => (
            <li 
              key={index} 
              className={onErrorClick ? "cursor-pointer hover:text-red-900 hover:underline" : ""}
              onClick={() => onErrorClick && onErrorClick(index)}
            >
              {error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ErrorSummary;