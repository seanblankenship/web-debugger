/**
 * Color Utilities
 * Utility functions for color manipulation and analysis
 */
export class ColorUtils {
    /**
     * Parse a color string into RGB components
     * @param {string} color - Color string (hex, rgb, rgba, hsl, hsla, named)
     * @returns {Object|null} Object with r, g, b components (0-255) or null if invalid
     */
    static parseColor(color) {
        if (!color) return null;

        // Check if already a color object
        if (
            typeof color === 'object' &&
            'r' in color &&
            'g' in color &&
            'b' in color
        ) {
            return { r: color.r, g: color.g, b: color.b, a: color.a ?? 1 };
        }

        // Convert to string if not already
        color = String(color).trim().toLowerCase();

        // Hex color (#fff or #ffffff)
        if (color.startsWith('#')) {
            return this.parseHex(color);
        }

        // RGB/RGBA color (rgb(255, 0, 0) or rgba(255, 0, 0, 0.5))
        if (color.startsWith('rgb')) {
            return this.parseRgb(color);
        }

        // HSL/HSLA color (hsl(0, 100%, 50%) or hsla(0, 100%, 50%, 0.5))
        if (color.startsWith('hsl')) {
            return this.parseHsl(color);
        }

        // Named color (red, blue, etc.)
        return this.parseNamedColor(color);
    }

    /**
     * Parse a hex color string
     * @param {string} hex - Hex color string (#fff or #ffffff)
     * @returns {Object|null} Object with r, g, b components (0-255) or null if invalid
     */
    static parseHex(hex) {
        // Remove leading # if present
        hex = hex.replace(/^#/, '');

        // Convert short hex to full form
        if (hex.length === 3) {
            hex = hex
                .split('')
                .map((c) => c + c)
                .join('');
        }

        // Handle rgba hex
        let alpha = 1;
        if (hex.length === 8) {
            alpha = parseInt(hex.slice(6, 8), 16) / 255;
            hex = hex.slice(0, 6);
        }

        // Validate hex
        if (!/^[0-9a-f]{6}$/i.test(hex)) {
            return null;
        }

        // Parse hex to rgb
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        return { r, g, b, a: alpha };
    }

    /**
     * Parse an RGB/RGBA color string
     * @param {string} rgb - RGB/RGBA color string
     * @returns {Object|null} Object with r, g, b components (0-255) or null if invalid
     */
    static parseRgb(rgb) {
        // Match RGB/RGBA pattern
        const regex =
            /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)/i;
        const match = rgb.match(regex);

        if (!match) {
            // Try alternative format: rgb(r g b / a)
            const altRegex =
                /rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([0-9.]+))?\s*\)/i;
            const altMatch = rgb.match(altRegex);

            if (!altMatch) {
                return null;
            }

            return {
                r: Math.min(255, Math.max(0, parseInt(altMatch[1]))),
                g: Math.min(255, Math.max(0, parseInt(altMatch[2]))),
                b: Math.min(255, Math.max(0, parseInt(altMatch[3]))),
                a: altMatch[4]
                    ? Math.min(1, Math.max(0, parseFloat(altMatch[4])))
                    : 1,
            };
        }

        return {
            r: Math.min(255, Math.max(0, parseInt(match[1]))),
            g: Math.min(255, Math.max(0, parseInt(match[2]))),
            b: Math.min(255, Math.max(0, parseInt(match[3]))),
            a: match[4] ? Math.min(1, Math.max(0, parseFloat(match[4]))) : 1,
        };
    }

    /**
     * Parse an HSL/HSLA color string
     * @param {string} hsl - HSL/HSLA color string
     * @returns {Object|null} Object with r, g, b components (0-255) or null if invalid
     */
    static parseHsl(hsl) {
        // Match HSL/HSLA pattern
        const regex =
            /hsla?\(\s*(\d+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%(?:\s*,\s*([0-9.]+))?\s*\)/i;
        const match = hsl.match(regex);

        if (!match) {
            // Try alternative format: hsl(h s% l% / a)
            const altRegex =
                /hsla?\(\s*(\d+)\s+([0-9.]+)%\s+([0-9.]+)%(?:\s*\/\s*([0-9.]+))?\s*\)/i;
            const altMatch = hsl.match(altRegex);

            if (!altMatch) {
                return null;
            }

            const h = parseInt(altMatch[1]);
            const s = parseFloat(altMatch[2]) / 100;
            const l = parseFloat(altMatch[3]) / 100;
            const a = altMatch[4]
                ? Math.min(1, Math.max(0, parseFloat(altMatch[4])))
                : 1;

            return this.hslToRgb(h, s, l, a);
        }

        const h = parseInt(match[1]);
        const s = parseFloat(match[2]) / 100;
        const l = parseFloat(match[3]) / 100;
        const a = match[4] ? Math.min(1, Math.max(0, parseFloat(match[4]))) : 1;

        return this.hslToRgb(h, s, l, a);
    }

    /**
     * Convert HSL to RGB
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-1)
     * @param {number} l - Lightness (0-1)
     * @param {number} a - Alpha (0-1)
     * @returns {Object} Object with r, g, b components (0-255)
     */
    static hslToRgb(h, s, l, a = 1) {
        h = (((h % 360) + 360) % 360) / 360; // Normalize hue to 0-1

        let r, g, b;

        if (s === 0) {
            // Achromatic (gray)
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = this.hueToRgb(p, q, h + 1 / 3);
            g = this.hueToRgb(p, q, h);
            b = this.hueToRgb(p, q, h - 1 / 3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255),
            a,
        };
    }

    /**
     * Helper function for HSL to RGB conversion
     * @private
     */
    static hueToRgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    /**
     * Parse a named color
     * @param {string} name - Color name
     * @returns {Object|null} Object with r, g, b components (0-255) or null if invalid
     */
    static parseNamedColor(name) {
        // Create a temp element to use the browser's color parsing
        const temp = document.createElement('div');
        temp.style.color = name;
        document.body.appendChild(temp);

        const computedColor = getComputedStyle(temp).color;
        document.body.removeChild(temp);

        // If the computed color is the same as the input, it's likely invalid
        if (computedColor === name) {
            return null;
        }

        return this.parseRgb(computedColor);
    }

    /**
     * Convert RGB to hex
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @param {number} a - Alpha (0-1)
     * @returns {string} Hex color string
     */
    static rgbToHex(r, g, b, a = 1) {
        const toHex = (c) => {
            const hex = Math.round(c).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

        // Add alpha if not 1
        if (a !== 1) {
            const alphaHex = toHex(Math.round(a * 255));
            return `${hex}${alphaHex}`;
        }

        return hex;
    }

    /**
     * Convert RGB to HSL
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @param {number} a - Alpha (0-1)
     * @returns {Object} Object with h (0-360), s (0-100), l (0-100) components
     */
    static rgbToHsl(r, g, b, a = 1) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h,
            s,
            l = (max + min) / 2;

        if (max === min) {
            // Achromatic (gray)
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100),
            a,
        };
    }

    /**
     * Convert any color format to RGBA string
     * @param {string|Object} color - Color in any supported format
     * @returns {string} RGBA string or empty if invalid
     */
    static toRgbaString(color) {
        const parsed = this.parseColor(color);
        if (!parsed) return '';

        const { r, g, b, a = 1 } = parsed;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    /**
     * Convert any color format to HSLA string
     * @param {string|Object} color - Color in any supported format
     * @returns {string} HSLA string or empty if invalid
     */
    static toHslaString(color) {
        const parsed = this.parseColor(color);
        if (!parsed) return '';

        const { r, g, b, a = 1 } = parsed;
        const { h, s, l } = this.rgbToHsl(r, g, b);

        return `hsla(${h}, ${s}%, ${l}%, ${a})`;
    }

    /**
     * Convert any color format to hex string
     * @param {string|Object} color - Color in any supported format
     * @returns {string} Hex string or empty if invalid
     */
    static toHexString(color) {
        const parsed = this.parseColor(color);
        if (!parsed) return '';

        const { r, g, b, a = 1 } = parsed;
        return this.rgbToHex(r, g, b, a);
    }

    /**
     * Check color contrast ratio against white and black
     * @param {string|Object} color - Color in any supported format
     * @returns {Object} Object with contrast ratios
     */
    static getContrastRatio(color) {
        const parsed = this.parseColor(color);
        if (!parsed)
            return { whiteRatio: 0, blackRatio: 0, bestTextColor: '#000000' };

        const { r, g, b } = parsed;

        // Calculate relative luminance (sRGB)
        const getLuminance = (r, g, b) => {
            const a = [r, g, b].map((v) => {
                v /= 255;
                return v <= 0.03928
                    ? v / 12.92
                    : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        };

        const luminance = getLuminance(r, g, b);
        const whiteLuminance = getLuminance(255, 255, 255);
        const blackLuminance = getLuminance(0, 0, 0);

        // Calculate contrast ratio
        const whiteRatio =
            (Math.max(whiteLuminance, luminance) + 0.05) /
            (Math.min(whiteLuminance, luminance) + 0.05);
        const blackRatio =
            (Math.max(luminance, blackLuminance) + 0.05) /
            (Math.min(luminance, blackLuminance) + 0.05);

        // Determine best text color
        const bestTextColor = whiteRatio > blackRatio ? '#ffffff' : '#000000';

        return {
            whiteRatio: whiteRatio.toFixed(2),
            blackRatio: blackRatio.toFixed(2),
            bestTextColor,
        };
    }

    /**
     * Check if a color passes WCAG contrast guidelines
     * @param {string|Object} foreground - Foreground color
     * @param {string|Object} background - Background color
     * @param {string} level - 'AA' or 'AAA'
     * @param {string} size - 'normal' or 'large'
     * @returns {boolean} Whether the colors pass WCAG contrast guidelines
     */
    static passesWCAG(foreground, background, level = 'AA', size = 'normal') {
        const fg = this.parseColor(foreground);
        const bg = this.parseColor(background);

        if (!fg || !bg) return false;

        // Calculate relative luminance (sRGB)
        const getLuminance = ({ r, g, b }) => {
            const a = [r, g, b].map((v) => {
                v /= 255;
                return v <= 0.03928
                    ? v / 12.92
                    : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        };

        const fgLum = getLuminance(fg);
        const bgLum = getLuminance(bg);

        // Calculate contrast ratio
        const ratio =
            (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);

        // WCAG 2.1 guidelines
        const requirements = {
            AA: {
                normal: 4.5,
                large: 3,
            },
            AAA: {
                normal: 7,
                large: 4.5,
            },
        };

        return ratio >= requirements[level][size];
    }

    /**
     * Generate color scheme based on a color
     * @param {string|Object} baseColor - Base color in any supported format
     * @param {string} scheme - Color scheme type (monochromatic, analogous, complementary, triadic, tetradic)
     * @param {number} count - Number of colors to generate
     * @returns {Array} Array of colors in hex format
     */
    static generateColorScheme(baseColor, scheme = 'monochromatic', count = 5) {
        const parsed = this.parseColor(baseColor);
        if (!parsed) return [];

        const { h, s, l } = this.rgbToHsl(parsed.r, parsed.g, parsed.b);
        const result = [];

        switch (scheme.toLowerCase()) {
            case 'monochromatic':
                // Generate shades of the same hue
                for (let i = 0; i < count; i++) {
                    const newL = Math.max(
                        0,
                        Math.min(100, l - 30 + (i * 60) / (count - 1))
                    );
                    const { r, g, b } = this.hslToRgb(h, s / 100, newL / 100);
                    result.push(this.rgbToHex(r, g, b));
                }
                break;

            case 'analogous':
                // Generate colors with adjacent hues
                const analogousRange = 60; // degrees
                for (let i = 0; i < count; i++) {
                    const newH =
                        (h + analogousRange * (i / (count - 1) - 0.5) + 360) %
                        360;
                    const { r, g, b } = this.hslToRgb(newH, s / 100, l / 100);
                    result.push(this.rgbToHex(r, g, b));
                }
                break;

            case 'complementary':
                // Generate colors with the base and its complement
                const complementDegree = 180;
                for (let i = 0; i < count; i++) {
                    const t = i / (count - 1);
                    const newH = (h + t * complementDegree + 360) % 360;
                    const { r, g, b } = this.hslToRgb(newH, s / 100, l / 100);
                    result.push(this.rgbToHex(r, g, b));
                }
                break;

            case 'triadic':
                // Generate three colors equidistant on the color wheel
                const triadicDegree = 120;
                for (let i = 0; i < count; i++) {
                    const section = Math.floor((i * 3) / count);
                    const newH = (h + section * triadicDegree + 360) % 360;
                    const { r, g, b } = this.hslToRgb(newH, s / 100, l / 100);
                    result.push(this.rgbToHex(r, g, b));
                }
                break;

            case 'tetradic':
                // Generate four colors in a rectangle on the color wheel
                const tetradDegrees = [0, 90, 180, 270];
                for (let i = 0; i < count; i++) {
                    const section = Math.floor((i * 4) / count);
                    const newH = (h + tetradDegrees[section] + 360) % 360;
                    const { r, g, b } = this.hslToRgb(newH, s / 100, l / 100);
                    result.push(this.rgbToHex(r, g, b));
                }
                break;

            default:
                // Default to monochromatic
                for (let i = 0; i < count; i++) {
                    const newL = Math.max(
                        0,
                        Math.min(100, l - 30 + (i * 60) / (count - 1))
                    );
                    const { r, g, b } = this.hslToRgb(h, s / 100, newL / 100);
                    result.push(this.rgbToHex(r, g, b));
                }
        }

        return result;
    }

    /**
     * Darken a color by a percentage
     * @param {string|Object} color - Color in any supported format
     * @param {number} amount - Amount to darken (0-100)
     * @returns {string} Hex color string
     */
    static darken(color, amount = 10) {
        const parsed = this.parseColor(color);
        if (!parsed) return '';

        const { h, s, l, a } = this.rgbToHsl(
            parsed.r,
            parsed.g,
            parsed.b,
            parsed.a
        );
        const newL = Math.max(0, l - amount);
        const { r, g, b } = this.hslToRgb(h, s / 100, newL / 100, a);

        return this.rgbToHex(r, g, b, a);
    }

    /**
     * Lighten a color by a percentage
     * @param {string|Object} color - Color in any supported format
     * @param {number} amount - Amount to lighten (0-100)
     * @returns {string} Hex color string
     */
    static lighten(color, amount = 10) {
        const parsed = this.parseColor(color);
        if (!parsed) return '';

        const { h, s, l, a } = this.rgbToHsl(
            parsed.r,
            parsed.g,
            parsed.b,
            parsed.a
        );
        const newL = Math.min(100, l + amount);
        const { r, g, b } = this.hslToRgb(h, s / 100, newL / 100, a);

        return this.rgbToHex(r, g, b, a);
    }

    /**
     * Adjust saturation of a color
     * @param {string|Object} color - Color in any supported format
     * @param {number} amount - Amount to adjust (-100 to 100)
     * @returns {string} Hex color string
     */
    static saturate(color, amount = 10) {
        const parsed = this.parseColor(color);
        if (!parsed) return '';

        const { h, s, l, a } = this.rgbToHsl(
            parsed.r,
            parsed.g,
            parsed.b,
            parsed.a
        );
        const newS = Math.min(100, Math.max(0, s + amount));
        const { r, g, b } = this.hslToRgb(h, newS / 100, l / 100, a);

        return this.rgbToHex(r, g, b, a);
    }

    /**
     * Adjust transparency of a color
     * @param {string|Object} color - Color in any supported format
     * @param {number} alpha - New alpha value (0-1)
     * @returns {string} RGBA color string
     */
    static setAlpha(color, alpha = 1) {
        const parsed = this.parseColor(color);
        if (!parsed) return '';

        const { r, g, b } = parsed;
        return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha))})`;
    }

    /**
     * Mix two colors
     * @param {string|Object} color1 - First color in any supported format
     * @param {string|Object} color2 - Second color in any supported format
     * @param {number} weight - Weight of the first color (0-1)
     * @returns {string} Hex color string
     */
    static mix(color1, color2, weight = 0.5) {
        const c1 = this.parseColor(color1);
        const c2 = this.parseColor(color2);

        if (!c1 || !c2) return '';

        const w = Math.min(1, Math.max(0, weight));
        const w2 = 1 - w;

        const r = Math.round(c1.r * w + c2.r * w2);
        const g = Math.round(c1.g * w + c2.g * w2);
        const b = Math.round(c1.b * w + c2.b * w2);
        const a =
            c1.a !== undefined && c2.a !== undefined
                ? c1.a * w + c2.a * w2
                : c1.a !== undefined
                ? c1.a
                : c2.a !== undefined
                ? c2.a
                : 1;

        return this.rgbToHex(r, g, b, a);
    }

    /**
     * Invert a color
     * @param {string|Object} color - Color in any supported format
     * @returns {string} Hex color string
     */
    static invert(color) {
        const parsed = this.parseColor(color);
        if (!parsed) return '';

        const { r, g, b, a } = parsed;
        return this.rgbToHex(255 - r, 255 - g, 255 - b, a);
    }

    /**
     * Check if a color is dark
     * @param {string|Object} color - Color in any supported format
     * @returns {boolean} True if the color is dark
     */
    static isDark(color) {
        const parsed = this.parseColor(color);
        if (!parsed) return false;

        const { r, g, b } = parsed;

        // Calculate perceived brightness
        // Using the formula: (R * 0.299 + G * 0.587 + B * 0.114) / 255
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

        return brightness < 0.5;
    }

    /**
     * Check if a color is light
     * @param {string|Object} color - Color in any supported format
     * @returns {boolean} True if the color is light
     */
    static isLight(color) {
        return !this.isDark(color);
    }

    /**
     * Extract colors from an image
     * @param {HTMLImageElement|string} image - Image element or URL
     * @param {number} count - Number of colors to extract
     * @returns {Promise<Array>} Promise resolving to array of hex colors
     */
    static extractColorsFromImage(image, count = 5) {
        return new Promise((resolve, reject) => {
            const processImage = (img) => {
                try {
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Resize canvas to a reasonable size
                    const maxSize = 100;
                    const width = Math.min(img.width, maxSize);
                    const height = Math.min(img.height, maxSize);

                    canvas.width = width;
                    canvas.height = height;

                    // Draw image to canvas
                    ctx.drawImage(img, 0, 0, width, height);

                    // Get image data
                    const imageData = ctx.getImageData(
                        0,
                        0,
                        width,
                        height
                    ).data;

                    // Sample pixels
                    const colors = {};
                    const step = Math.max(
                        1,
                        Math.floor((width * height) / 10000)
                    );

                    for (let i = 0; i < imageData.length; i += 4 * step) {
                        const r = imageData[i];
                        const g = imageData[i + 1];
                        const b = imageData[i + 2];
                        const a = imageData[i + 3];

                        // Skip transparent pixels
                        if (a < 128) continue;

                        // Quantize colors a bit to reduce the number of unique colors
                        const quantized = `${Math.floor(r / 8) * 8},${
                            Math.floor(g / 8) * 8
                        },${Math.floor(b / 8) * 8}`;

                        if (!colors[quantized]) {
                            colors[quantized] = {
                                r,
                                g,
                                b,
                                count: 0,
                            };
                        }

                        colors[quantized].count++;
                    }

                    // Convert to array and sort by frequency
                    const colorArray = Object.values(colors).sort(
                        (a, b) => b.count - a.count
                    );

                    // Convert to hex and return top colors
                    const result = colorArray
                        .slice(0, count)
                        .map((c) => this.rgbToHex(c.r, c.g, c.b));

                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            };

            // If image is a URL, load it first
            if (typeof image === 'string') {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => processImage(img);
                img.onerror = (e) => reject(new Error('Failed to load image'));
                img.src = image;
            } else if (image instanceof HTMLImageElement) {
                processImage(image);
            } else {
                reject(new Error('Invalid image input'));
            }
        });
    }

    /**
     * Get CSS variables with color values from an element
     * @param {HTMLElement} element - Element to check
     * @returns {Object} Object with CSS variable names and color values
     */
    static getCSSColorVariables(element = document.documentElement) {
        const result = {};
        const styles = getComputedStyle(element);

        for (let i = 0; i < styles.length; i++) {
            const prop = styles[i];
            if (prop.startsWith('--')) {
                const value = styles.getPropertyValue(prop).trim();

                // Check if the value is a color
                if (this.parseColor(value)) {
                    result[prop] = value;
                }
            }
        }

        return result;
    }

    /**
     * Get all color properties from an element
     * @param {HTMLElement} element - Element to check
     * @returns {Object} Object with color property names and values
     */
    static getElementColorProperties(element) {
        const colorProps = [
            'color',
            'background-color',
            'border-color',
            'border-top-color',
            'border-right-color',
            'border-bottom-color',
            'border-left-color',
            'outline-color',
            'text-decoration-color',
            'caret-color',
        ];

        const result = {};
        const styles = getComputedStyle(element);

        colorProps.forEach((prop) => {
            const value = styles.getPropertyValue(prop).trim();
            if (value && value !== 'none' && value !== 'transparent') {
                result[prop] = value;
            }
        });

        return result;
    }

    /**
     * Get CSS gradient from a string
     * @param {string} gradientStr - Gradient string
     * @returns {Object|null} Gradient object or null if invalid
     */
    static parseGradient(gradientStr) {
        if (!gradientStr || typeof gradientStr !== 'string') return null;

        gradientStr = gradientStr.trim();

        // Check if it's a gradient
        if (!gradientStr.includes('gradient(')) return null;

        const result = {
            type: '',
            stops: [],
            angle: null,
        };

        // Determine gradient type
        if (gradientStr.includes('linear-gradient')) {
            result.type = 'linear';
        } else if (gradientStr.includes('radial-gradient')) {
            result.type = 'radial';
        } else if (gradientStr.includes('conic-gradient')) {
            result.type = 'conic';
        } else {
            return null;
        }

        // Extract angle for linear gradients
        if (result.type === 'linear') {
            const angleMatch = gradientStr.match(
                /linear-gradient\(\s*([^,]+),/
            );
            if (angleMatch && angleMatch[1]) {
                if (angleMatch[1].includes('deg')) {
                    result.angle = parseFloat(angleMatch[1]);
                } else if (angleMatch[1].includes('to ')) {
                    // Convert direction to angle
                    const directions = {
                        'to top': 0,
                        'to right': 90,
                        'to bottom': 180,
                        'to left': 270,
                        'to top right': 45,
                        'to bottom right': 135,
                        'to bottom left': 225,
                        'to top left': 315,
                    };
                    result.angle = directions[angleMatch[1].trim()] || 180;
                } else {
                    result.angle = 180; // Default angle
                }
            }
        }

        // Extract color stops
        const content = gradientStr.substring(
            gradientStr.indexOf('(') + 1,
            gradientStr.lastIndexOf(')')
        );

        // Split by commas but ignore commas inside parentheses (for rgb/rgba values)
        let currentToken = '';
        let inParentheses = 0;
        const tokens = [];

        for (let i = 0; i < content.length; i++) {
            const char = content[i];

            if (char === '(') {
                inParentheses++;
                currentToken += char;
            } else if (char === ')') {
                inParentheses--;
                currentToken += char;
            } else if (char === ',' && inParentheses === 0) {
                tokens.push(currentToken.trim());
                currentToken = '';
            } else {
                currentToken += char;
            }
        }

        if (currentToken) {
            tokens.push(currentToken.trim());
        }

        // Process color stops
        let startIndex = 0;

        // Skip the first token if it's an angle
        if (result.angle !== null) {
            startIndex = 1;
        }

        for (let i = startIndex; i < tokens.length; i++) {
            const token = tokens[i].trim();

            // Parse color and position
            let colorPart = token;
            let positionPart = null;

            // Check if the token has a position
            const lastSpace = token.lastIndexOf(' ');
            if (lastSpace !== -1) {
                const potentialPosition = token.substring(lastSpace + 1);

                // Check if the potential position is a percentage or length
                if (
                    potentialPosition.endsWith('%') ||
                    potentialPosition.endsWith('px') ||
                    potentialPosition.endsWith('em') ||
                    potentialPosition.endsWith('rem')
                ) {
                    colorPart = token.substring(0, lastSpace).trim();
                    positionPart = potentialPosition;
                }
            }

            // Parse the color
            const color = this.parseColor(colorPart);

            if (color) {
                result.stops.push({
                    color: this.toRgbaString(color),
                    position: positionPart,
                });
            }
        }

        return result.stops.length > 0 ? result : null;
    }
}
