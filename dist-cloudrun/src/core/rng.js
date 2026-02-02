// Deterministic RNG (mulberry32) — good enough for v0.1 sampling
export function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export function randUniform(rng, min, max) {
    return min + (max - min) * rng();
}
// Box-Muller
export function randNormal(rng, mean = 0, std = 1) {
    let u = 0, v = 0;
    while (u === 0)
        u = rng();
    while (v === 0)
        v = rng();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + std * z;
}
export function clamp(x, lo, hi) {
    return Math.max(lo, Math.min(hi, x));
}
