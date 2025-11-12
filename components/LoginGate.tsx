import React, { useState, FormEvent } from 'react';
import { ShieldCheckIcon } from './icons';

interface LoginGateProps {
  onSubmit: (token: string) => Promise<void>;
  isVerifying: boolean;
  errorMessage?: string | null;
}

const LoginGate: React.FC<LoginGateProps> = ({ onSubmit, isVerifying, errorMessage }) => {
  const [token, setToken] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token.trim()) {
      setLocalError('Please provide a token to continue.');
      return;
    }

    setLocalError(null);
    await onSubmit(token.trim());
  };

  return (
    <div className="min-h-screen bg-[--color-bg] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[--color-panel] border border-[--color-border] rounded-2xl shadow-xl p-10">
        <div className="flex items-center mb-6">
          <div className="bg-[--color-active-pill] bg-opacity-20 rounded-full p-3 text-[--color-active-pill]">
            <ShieldCheckIcon className="w-8 h-8" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-semibold text-[--color-text]">Secure Access</h1>
            <p className="text-sm text-[--color-text-muted]">
              Enter your access token to unlock the Vendor Analysis Tool.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-[--color-text] mb-2">
              Access Token
            </label>
            <input
              id="token"
              type="text"
              className="w-full rounded-lg border border-[--color-border] bg-[--color-surface] p-3 text-[--color-text] focus:outline-none focus:ring-2 focus:ring-[--color-active-pill] focus:border-transparent"
              placeholder="Paste your token here"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              disabled={isVerifying}
              autoComplete="off"
            />
            {(localError || errorMessage) && (
              <p className="mt-2 text-sm text-red-400">{localError ?? errorMessage}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center rounded-lg bg-[--color-active-pill] py-3 px-4 text-white font-semibold transition hover:bg-opacity-90 disabled:opacity-60"
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying…' : 'Unlock Workspace'}
          </button>
        </form>

        <p className="mt-6 text-xs text-[--color-text-muted] text-center">
          Tokens are time-limited for your security. Contact the administrator if you need a new token.
        </p>
      </div>
    </div>
  );
};

export default LoginGate;
