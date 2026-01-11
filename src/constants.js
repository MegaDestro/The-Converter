export const CONVERTER_TYPES = ['Currency', 'Weight', 'Length'];

export const RATES = {
    weight: { t: 1000, st: 6.35029, kg: 1, lb: 0.453592, oz: 0.0283495, g: 0.001, ct: 0.0002, mg: 0.000001 },
    length: { ly: 9460730472580.8, au: 149597870700, mi: 1609.34, km: 1000, m: 1, ft: 0.3048, in: 0.0254, cm: 0.01, mm: 0.001, µm: 0.000001, nm: 0.000000001 }
};

export const LABELS = {
    weight: { t: 'Tonnes', st: 'Stones', kg: 'Kilograms', lb: 'Pounds', oz: 'Ounces', g: 'Grams', ct: 'Carats', mg: 'Milligrams' },
    length: { ly: 'Light Years', au: 'Astronomical Units', mi: 'Miles', km: 'Kilometers', m: 'Meters', ft: 'Feet', in: 'Inches', cm: 'Centimeters', mm: 'Millimeters', µm: 'Micrometers', nm: 'Nanometers' }
};
