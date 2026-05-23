import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
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


const renderWithRoute = (route: string) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );
};

describe('App routing', () => {
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

  it('renders AdminBoard on /admin/dashboard', () => {
    renderWithRoute('/admin/dashboard');
    expect(screen.getByRole('heading', { name: 'Faculty Activity' })).toBeInTheDocument();
  });

  it('renders AddSchedule on /admin/add-schedule', () => {
    renderWithRoute('/admin/add-schedule');
    expect(screen.getByText('Add Schedule Page')).toBeInTheDocument();
  });
});