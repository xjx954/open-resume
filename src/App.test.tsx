import React from 'react';
import { render } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

test('renders without crashing', () => {
  const { container } = render(<App />);
  expect(container).toBeTruthy();
});

test('App defines route-level error boundaries instead of a single global boundary', () => {
  const source = fs.readFileSync(path.join(__dirname, 'App.tsx'), 'utf8');
  const routeBoundaryMatches = source.match(/<ErrorBoundary/g) || [];

  expect(routeBoundaryMatches.length).toBeGreaterThanOrEqual(3);
  expect(ErrorBoundary).toBeTruthy();
});
