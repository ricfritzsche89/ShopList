import { normalizeAmount, denormalizeAmount, formatQuantity, areUnitsCompatible } from '../utils/unitConverter';

describe('unitConverter', () => {
  describe('normalizeAmount', () => {
    test('sollte kg in g umrechnen', () => {
      expect(normalizeAmount(1.5, 'kg')).toEqual({ quantity: 1500, unit: 'g' });
      expect(normalizeAmount(0.5, 'kg')).toEqual({ quantity: 500, unit: 'g' });
    });

    test('sollte l in ml umrechnen', () => {
      expect(normalizeAmount(0.75, 'l')).toEqual({ quantity: 750, unit: 'ml' });
      expect(normalizeAmount(1, 'liter')).toEqual({ quantity: 1000, unit: 'ml' });
    });

    test('sollte andere Einheiten unverändert lassen', () => {
      expect(normalizeAmount(3, 'Stück')).toEqual({ quantity: 3, unit: 'stück' });
      expect(normalizeAmount(2, 'Prise')).toEqual({ quantity: 2, unit: 'prise' });
    });

    test('sollte null zurückgeben, wenn Menge null ist', () => {
      expect(normalizeAmount(null, 'g')).toBeNull();
    });
  });

  describe('denormalizeAmount', () => {
    test('sollte g >= 1000 in kg umrechnen', () => {
      expect(denormalizeAmount(1200, 'g')).toEqual({ quantity: 1.2, unit: 'kg' });
      expect(denormalizeAmount(500, 'g')).toEqual({ quantity: 500, unit: 'g' });
    });

    test('sollte ml >= 1000 in l umrechnen', () => {
      expect(denormalizeAmount(1500, 'ml')).toEqual({ quantity: 1.5, unit: 'l' });
      expect(denormalizeAmount(250, 'ml')).toEqual({ quantity: 250, unit: 'ml' });
    });
  });

  describe('formatQuantity', () => {
    test('sollte Brüche schön formatieren', () => {
      expect(formatQuantity(0.5)).toBe('1/2');
      expect(formatQuantity(0.25)).toBe('1/4');
      expect(formatQuantity(1.5)).toBe('1 1/2');
    });

    test('sollte Ganzzahlen ohne Nachkommastellen ausgeben', () => {
      expect(formatQuantity(5.0)).toBe('5');
      expect(formatQuantity(10)).toBe('10');
    });

    test('sollte Dezimalzahlen runden', () => {
      expect(formatQuantity(2.3333)).toBe('2.33');
      expect(formatQuantity(15.4)).toBe('15'); // über 10 ganzzahlig gerundet
    });

    test('sollte leeren String für null zurückgeben', () => {
      expect(formatQuantity(null)).toBe('');
    });
  });

  describe('areUnitsCompatible', () => {
    test('sollte kompatible Einheiten erkennen', () => {
      expect(areUnitsCompatible('g', 'kg')).toBe(true);
      expect(areUnitsCompatible('ml', 'l')).toBe(true);
      expect(areUnitsCompatible('Stück', 'stück')).toBe(true);
    });

    test('sollte inkompatible Einheiten erkennen', () => {
      expect(areUnitsCompatible('g', 'ml')).toBe(false);
      expect(areUnitsCompatible('Stück', 'g')).toBe(false);
    });
  });
});
