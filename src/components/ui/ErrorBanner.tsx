import React from "react";

export interface ErrorBannerProps {
  message: string | null | undefined;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      {message}
    </div>
  );
};
