import { vi } from 'vitest';
import '@testing-library/jest-dom';

HTMLCanvasElement.prototype.getContext = vi.fn();