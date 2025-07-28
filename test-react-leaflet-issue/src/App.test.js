import { render, screen } from '@testing-library/react';
import React from 'react';


const MockApp = () => {
  return (
      <h1>
        please work
      </h1>
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
