import { isPositive } from './isPositive';

test('isPositive runs without error', () => {
  isPositive(5); // deliberately never checks the actual result — this is the "hollow" test
});