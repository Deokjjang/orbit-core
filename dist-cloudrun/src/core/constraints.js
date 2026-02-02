export function evalConstraints(state, constraints) {
    const hardRejects = [];
    const softPenalties = [];
    for (const c of constraints) {
        const r = c.evaluate(state);
        if (c.type === 'HARD') {
            if (r.reject === true)
                hardRejects.push(c.name);
            continue;
        }
        // SOFT
        const p = r.penalty ?? 0;
        if (p > 0)
            softPenalties.push({ name: c.name, penalty: p });
    }
    return {
        hardRejected: hardRejects.length > 0,
        hardRejects,
        softPenalties,
        softPenaltySum: softPenalties.reduce((a, b) => a + b.penalty, 0),
    };
}
