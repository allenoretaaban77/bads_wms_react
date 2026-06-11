import React, { useState } from 'react';
import useAppViewModel from '../viewmodels/useAppViewModel.tsx';
import '../App.css';

function LoginView() {
  const [showPassword, setShowPassword] = useState(false);
  const username = useAppViewModel((state) => state.username);
  const password = useAppViewModel((state) => state.password);
  const formError = useAppViewModel((state) => state.formError);
  const isLoading = useAppViewModel((state) => state.isLoading);
  const setField = useAppViewModel((state) => state.setField);
  const login = useAppViewModel((state) => state.login);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login();
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-branding">
          <h1>Badong's Hardware Inventory System</h1>
          <p>Sign in to continue to the inventory dashboard.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setField('username', event.target.value)}
              placeholder="Enter username"
            />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setField('password', event.target.value)}
                placeholder="Enter password"
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {formError && <div className="form-error">{formError}</div>}

          <button 
            className="mt-3 px-3 py-2 bg-button text-white rounded-custom hover:bg-button-hover transition-colors duration-200 flex items-center text-sm"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg className="animate-spin h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Signing In...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg 
                  width="16" 
                  height="16" 
                  style={{ marginRight: '8px' }} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                  />
                </svg>
                Sign In
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginView;
