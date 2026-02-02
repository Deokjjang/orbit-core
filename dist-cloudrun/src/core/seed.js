// src/core/seed.ts
// deterministic seed splitting (SSOT)
export function splitSeed(seed, salt) {
    let x = (seed ^ (salt * 0x9E3779B9)) >>> 0;
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x >>>= 0;
    x ^= x << 5;
    x >>>= 0;
    return x >>> 0;
}
