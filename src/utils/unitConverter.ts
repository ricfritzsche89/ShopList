export interface NormalizedAmount {
  quantity: number;
  unit: string;
}

/**
 * Normalisiert eine Menge basierend auf ihrer Einheit.
 * Wandelt z.B. kg in g um, oder l in ml, um das Zusammenrechnen zu vereinfachen.
 */
export function normalizeAmount(quantity: number | null, unit: string | null): NormalizedAmount | null {
  if (quantity === null || quantity === undefined) return null;
  if (!unit) return { quantity, unit: '' };

  const cleanUnit = unit.trim().toLowerCase();

  if (cleanUnit === 'kg') {
    return { quantity: quantity * 1000, unit: 'g' };
  }
  if (cleanUnit === 'l' || cleanUnit === 'liter') {
    return { quantity: quantity * 1000, unit: 'ml' };
  }

  // Andere Einheiten bleiben unkonvertiert
  return { quantity, unit: cleanUnit };
}

/**
 * Wandelt eine normalisierte Menge wieder in eine lesbare,
 * größere Einheit um (z.B. 1200g in 1.2kg), falls sinnvoll.
 */
export function denormalizeAmount(quantity: number, unit: string): NormalizedAmount {
  const cleanUnit = unit.trim().toLowerCase();

  if (cleanUnit === 'g' && quantity >= 1000) {
    return { quantity: quantity / 1000, unit: 'kg' };
  }
  if (cleanUnit === 'ml' && quantity >= 1000) {
    return { quantity: quantity / 1000, unit: 'l' };
  }

  return { quantity, unit };
}

/**
 * Formatiert eine Dezimalzahl in eine schöne lesbare Angabe.
 * Zum Beispiel: 0.5 -> 1/2 oder 0.5, 0.25 -> 1/4, 333.33 -> 330.
 */
export function formatQuantity(quantity: number | null): string {
  if (quantity === null || quantity === undefined) return '';
  
  // Runden auf max 2 Nachkommastellen
  const rounded = Math.round((quantity + Number.EPSILON) * 100) / 100;
  
  // Konvertierung von gängigen Brüchen für schönere Darstellung (optional, aber sehr nett)
  if (rounded === 0.5) return '1/2';
  if (rounded === 0.25) return '1/4';
  if (rounded === 0.75) return '3/4';
  if (rounded === 1.5) return '1 1/2';
  
  // Wenn es eine ganze Zahl ist, keine Nachkommastellen zeigen
  if (Number.isInteger(rounded)) return rounded.toString();

  // Bei Werten über 10 und Nachkommastellen runden wir auf eine Nachkommastelle oder ganz
  if (rounded > 10) {
    return Math.round(rounded).toString();
  }

  return rounded.toString();
}

/**
 * Überprüft, ob zwei Einheiten miteinander kompatibel sind (d.h. zusammengeführt werden können).
 */
export function areUnitsCompatible(unit1: string | null, unit2: string | null): boolean {
  const u1 = (unit1 || '').trim().toLowerCase();
  const u2 = (unit2 || '').trim().toLowerCase();

  if (u1 === u2) return true;

  const weightUnits = ['g', 'kg'];
  const volumeUnits = ['ml', 'l', 'liter'];

  if (weightUnits.includes(u1) && weightUnits.includes(u2)) return true;
  if (volumeUnits.includes(u1) && volumeUnits.includes(u2)) return true;

  return false;
}
