/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
/* eslint-disable import/no-unresolved */
// src/__tests__/unit/components/loginForm.test.tsx

import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import LoginForm from '../../../pages/index'; // Update if LoginForm is elsewhere
import '@testing-library/jest-dom';

// Correct way to mock the global fetch API
global.fetch = jest.fn(() => Promise.resolve({
  ok: true, // Simulate a successful login response
  json: async () => ({ token: 'mock-token' }),
})) as jest.Mock;

describe('LoginForm', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear(); // Clear mock history before each test
    delete (window as any).location; // Clean up between tests
    (window as any).location = { href: '' };
  });

  test('renders username and password inputs + submit button', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  test('submit button is disabled when inputs are empty', () => {
    render(<LoginForm />);
    expect(screen.getByText(/login/i)).toBeDisabled();
  });

  test('submit button is enabled when both inputs are filled', () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'john_doe' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    expect(screen.getByText(/login/i)).toBeEnabled();
  });

  test('calls login API and redirects on successful login', async () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'john_doe' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText(/login/i));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      '/api/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'john_doe', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    expect(window.location.href).toBe('/dashboard');
  });

  test('shows error when login fails', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve({
      ok: false,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid credentials' }),
    }));

    render(<LoginForm />);
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'john_doe' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrong_password' } });
    fireEvent.click(screen.getByText(/login/i));

    await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument());
  });
});
function expect(_arg0: any) {
  throw new Error('Function not implemented.');
}
