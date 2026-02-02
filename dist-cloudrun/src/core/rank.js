export function rankInternal(attractors) {
    const xs = [...attractors].sort((a, b) => a.energy.total - b.energy.total);
    const n = xs.length || 1;
    return xs.map((a, i) => ({
        attractorId: a.id,
        percentile: Math.round((i / Math.max(1, n - 1)) * 100),
    }));
}
