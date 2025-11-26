// lib/colorExtractor.ts
interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }

function rgbToHsl({ r, g, b }: RGB): HSL {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function getLuminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(rgb1: RGB, rgb2: RGB): number {
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

export interface DynamicTheme {
    '--bg-primary': string;
    '--bg-secondary': string;
    '--text-primary': string;
    '--text-secondary': string;
    '--border-primary': string;
    '--accent': string;
}

export async function generateThemeFromImage(imageUrl: string): Promise<DynamicTheme | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const SIZE = 50;
            canvas.width = SIZE;
            canvas.height = SIZE;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }

            ctx.drawImage(img, 0, 0, SIZE, SIZE);
            const imageData = ctx.getImageData(0, 0, SIZE, SIZE).data;

            const colorCounts: { [key: string]: { rgb: RGB, count: number } } = {};
            for (let i = 0; i < imageData.length; i += 4) {
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                const key = `${r},${g},${b}`;
                if (!colorCounts[key]) {
                    colorCounts[key] = { rgb: { r, g, b }, count: 0 };
                }
                colorCounts[key].count++;
            }

            const sortedColors = Object.values(colorCounts)
                .sort((a, b) => b.count - a.count)
                .map(c => ({ ...c, hsl: rgbToHsl(c.rgb) }));

            if (sortedColors.length === 0) {
                resolve(null);
                return;
            }

            // Find base background color (prefer dark, desaturated)
            let bgPrimary = sortedColors.find(c => c.hsl.l < 30 && c.hsl.s < 50) ||
                            sortedColors.find(c => c.hsl.l < 40) ||
                            sortedColors.sort((a,b) => a.hsl.l - b.hsl.l)[0];

            // Find accent color (prefer vibrant, saturated, good contrast with background)
            let accent = sortedColors
                .filter(c => c.hsl.s > 40 && c.hsl.l > 40 && c.hsl.l < 85)
                .sort((a, b) => getContrastRatio(b.rgb, bgPrimary.rgb) - getContrastRatio(a.rgb, bgPrimary.rgb))[0] ||
                sortedColors.sort((a, b) => b.hsl.s - a.hsl.s)[0];

            // Find text color (high contrast with background)
            let textPrimary = sortedColors
                .filter(c => getContrastRatio(c.rgb, bgPrimary.rgb) > 7)
                .sort((a, b) => b.hsl.l - a.hsl.l)[0] ||
                (bgPrimary.hsl.l < 50 ? { rgb: { r: 245, g: 245, b: 245 } } : { rgb: { r: 10, g: 10, b: 10 } });

            const bgPrimaryRGB = bgPrimary.rgb;
            const textPrimaryRGB = textPrimary.rgb;
            const accentRGB = accent.rgb;
            
            const toRgbString = (c: RGB) => `rgb(${c.r}, ${c.g}, ${c.b})`;
            
            const theme: DynamicTheme = {
                '--bg-primary': toRgbString(bgPrimaryRGB),
                '--bg-secondary': `rgba(${bgPrimaryRGB.r}, ${bgPrimaryRGB.g}, ${bgPrimaryRGB.b}, 0.7)`,
                '--text-primary': toRgbString(textPrimaryRGB),
                '--text-secondary': `rgba(${textPrimaryRGB.r}, ${textPrimaryRGB.g}, ${textPrimaryRGB.b}, 0.7)`,
                '--border-primary': `rgba(${textPrimaryRGB.r}, ${textPrimaryRGB.g}, ${textPrimaryRGB.b}, 0.2)`,
                '--accent': toRgbString(accentRGB),
            };

            resolve(theme);
        };
        img.onerror = () => {
            resolve(null);
        };
    });
}
