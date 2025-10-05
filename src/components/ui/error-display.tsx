"use client";

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  XCircle,
  Info,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import { ErrorInfo } from '@/hooks/use-error-handler';

interface ErrorDisplayProps {
  error: string | ErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'alert' | 'card' | 'toast';
  showDetails?: boolean;
  retryLabel?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  variant = 'alert',
  showDetails = false,
  retryLabel = 'Try Again',
}: ErrorDisplayProps) {
  const [showDetailedError, setShowDetailedError] = useState(false);
  
  const errorInfo: ErrorInfo = typeof error === 'string' 
    ? { message: error, timestamp: new Date() }
    : error;

  const getSeverityColor = () => {
    if (errorInfo.code === '401' || errorInfo.code === '403') return 'destructive';
    if (errorInfo.recoverable) return 'default';
    return 'destructive';
  };

  const getSeverityIcon = () => {
    if (errorInfo.code === '401' || errorInfo.code === '403') return XCircle;
    if (errorInfo.recoverable) return AlertCircle;
    return AlertTriangle;
  };

  const copyErrorToClipboard = () => {
    const errorText = JSON.stringify(errorInfo, null, 2);
    navigator.clipboard.writeText(errorText);
  };

  if (variant === 'alert') {
    const SeverityIcon = getSeverityIcon();
    
    return (
      <Alert variant={getSeverityColor() as any} className="relative">
        <SeverityIcon className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          Error Occurred
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{errorInfo.message}</p>
          
          {errorInfo.recoverable && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <Info className="h-3 w-3 mr-1" />
              This error may be temporary
            </Badge>
          )}
          
          <div className="flex gap-2">
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                {retryLabel}
              </Button>
            )}
            
            {showDetails && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDetailedError(!showDetailedError)}
              >
                {showDetailedError ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show Details
                  </>
                )}
              </Button>
            )}
          </div>
          
          {showDetailedError && (
            <div className="mt-3 p-3 bg-muted rounded border text-xs font-mono">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Error Details</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyErrorToClipboard}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-1">
                <div><strong>Message:</strong> {errorInfo.message}</div>
                {errorInfo.code && <div><strong>Code:</strong> {errorInfo.code}</div>}
                <div><strong>Time:</strong> {errorInfo.timestamp.toLocaleString()}</div>
                {errorInfo.details && (
                  <div>
                    <strong>Details:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {JSON.stringify(errorInfo.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'card') {
    const SeverityIcon = getSeverityIcon();
    
    return (
      <Card className="border-destructive">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <SeverityIcon className="h-5 w-5" />
            Error Occurred
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0 ml-auto"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{errorInfo.message}</p>
          
          {errorInfo.recoverable && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <Info className="h-3 w-3 mr-1" />
              This error may be temporary
            </Badge>
          )}
          
          <div className="flex gap-2">
            {onRetry && (
              <Button size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                {retryLabel}
              </Button>
            )}
            
            {showDetails && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDetailedError(!showDetailedError)}
              >
                {showDetailedError ? 'Hide Details' : 'Show Details'}
              </Button>
            )}
          </div>
          
          {showDetailedError && (
            <div className="p-3 bg-muted rounded border text-xs font-mono">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Error Details</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyErrorToClipboard}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-1">
                <div><strong>Code:</strong> {errorInfo.code || 'Unknown'}</div>
                <div><strong>Time:</strong> {errorInfo.timestamp.toLocaleString()}</div>
                {errorInfo.details && (
                  <div>
                    <strong>Details:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {JSON.stringify(errorInfo.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}

interface ErrorBoundaryDisplayProps {
  errors: ErrorInfo[];
  onClearAll?: () => void;
  onRemoveError?: (timestamp: Date) => void;
  maxVisible?: number;
}

export function ErrorBoundaryDisplay({
  errors,
  onClearAll,
  onRemoveError,
  maxVisible = 3,
}: ErrorBoundaryDisplayProps) {
  if (errors.length === 0) return null;

  const visibleErrors = errors.slice(0, maxVisible);
  const hiddenCount = errors.length - maxVisible;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-destructive">
          Recent Errors ({errors.length})
        </h4>
        {onClearAll && errors.length > 0 && (
          <Button size="sm" variant="ghost" onClick={onClearAll}>
            Clear All
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {visibleErrors.map((error, index) => (
          <ErrorDisplay
            key={error.timestamp.toISOString()}
            error={error}
            onDismiss={() => onRemoveError?.(error.timestamp)}
            variant="alert"
            showDetails={index === 0} // Show details for the most recent error
          />
        ))}
        
        {hiddenCount > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            and {hiddenCount} more error{hiddenCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}