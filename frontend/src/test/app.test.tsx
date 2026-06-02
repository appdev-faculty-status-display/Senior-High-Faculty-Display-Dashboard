import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock all page components to isolate routing tests
vi.mock('../pages/facultyDashboard', () => ({
  default: () => <div>FacultyBoard Page</div>,
}));
vi.mock('../pages/admin/admin-login', () => ({
  default: () => <div>Admin Login Page</div>,
}));
vi.mock('@/pages/adminDashboard', () => ({
  default: () => <div>Admin Dashboard Page</div>,
}));
vi.mock('../pages/requestFormPage', () => ({
  default: () => <div>Request Form Page</div>,
}));


const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const renderWithRoute = (route: string) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );
};

function createJwt(expOffsetSeconds: number, role = 'principal') {
  const toBase64Url = (value: string) =>
    globalThis.btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

  const header = toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = toBase64Url(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expOffsetSeconds, role }));

  return `${header}.${payload}.signature`;
}

describe('App routing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders FacultyBoard on /', () => {
    renderWithRoute('/');
    expect(screen.getByText('FacultyBoard Page')).toBeInTheDocument();
  });

  it('renders AdminLogin on /admin/login', () => {
    renderWithRoute('/admin/login');
    expect(screen.getByText('Admin Login Page')).toBeInTheDocument();
  });

  it('renders RequestForm on /request', () => {
    renderWithRoute('/request');
    expect(screen.getByText('Request Form Page')).toBeInTheDocument();
  });

  it('shows 401 for admin routes when not signed in', () => {
    renderWithRoute('/admin/dashboard');
    expect(screen.getByRole('heading', { name: 'Unauthorized' })).toBeInTheDocument();
    expect(screen.getByText('401')).toBeInTheDocument();
  });

  it('shows 403 for expired admin sessions', () => {
    localStorage.setItem(TOKEN_KEY, createJwt(-60));
    localStorage.setItem(USER_KEY, JSON.stringify({ role: 'principal', name: 'Principal User' }));

    renderWithRoute('/admin/dashboard');
    expect(screen.getByRole('heading', { name: 'Forbidden' })).toBeInTheDocument();
    expect(screen.getByText('403')).toBeInTheDocument();
  });

  it('renders AdminBoard on /admin/dashboard when the token is valid', () => {
    localStorage.setItem(TOKEN_KEY, createJwt(3600));
    localStorage.setItem(USER_KEY, JSON.stringify({ role: 'principal', name: 'Principal User' }));

    renderWithRoute('/admin/dashboard');
    expect(screen.getByRole('heading', { name: 'Faculty Activity' })).toBeInTheDocument();
  });
});