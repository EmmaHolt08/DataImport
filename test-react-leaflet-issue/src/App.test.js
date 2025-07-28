import { render, screen } from '@testing-library/react';
import React from 'react';

import ReportForm from './ReportForm';

const MockApp = () => {
  return (
      <ReportForm>
        <div data-testid="app-content">Welcome to the Landslide App!</div>
      </ReportForm>
  );
};

describe('ReportForm component', () => {
  test('renders Landslide Report Login when not authenticated', () => {
    render(<MockApp />);

    const loginTitle = screen.getByText(/Landslide Report Login/i);
    expect(loginTitle).toBeInTheDocument();

    const appContent = screen.queryByTestId('app-content');
    expect(appContent).not.toBeInTheDocument();
  });
});
