import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// 각 테스트 후 cleanup
afterEach(() => {
  cleanup();
});
