// normalized distance: dist01 = rawL2/4  (raw axes in [-1,1])
function distRaw(a, b) {
    const dv = a[0] - b[0];
    const dr = a[1] - b[1];
    const du = a[2] - b[2];
    const di = a[3] - b[3];
    return Math.sqrt(dv * dv + dr * dr + du * du + di * di);
}
function meanCenter(members) {
    const n = members.length || 1;
    let v = 0, r = 0, u = 0, i = 0;
    for (const s of members) {
        v += s.core.v;
        r += s.core.r;
        u += s.core.u;
        i += s.core.i;
    }
    return { core: { v: v / n, r: r / n, u: u / n, i: i / n } };
}
// ---- Grid bucketing (4D) ----
// cellSize = epsRaw, bucket key by floor((axis+1)/cellSize)
// query neighbor buckets in +/-1 cell in each dimension => 3^4=81 buckets
function bucketCoord(x, cell) {
    // axis in [-1,1] -> shift to [0,2]
    return Math.floor((x + 1) / cell);
}
function bucketKey4(a, b, c, d) {
    // fast stable key
    return `${a}|${b}|${c}|${d}`;
}
function buildBuckets(vecs, cell) {
    const m = new Map();
    for (let i = 0; i < vecs.length; i++) {
        const v = vecs[i];
        const k = bucketKey4(bucketCoord(v[0], cell), bucketCoord(v[1], cell), bucketCoord(v[2], cell), bucketCoord(v[3], cell));
        const arr = m.get(k);
        if (arr)
            arr.push(i);
        else
            m.set(k, [i]);
    }
    return m;
}
function regionQueryBucketed(vecs, buckets, idx, epsRaw, cell) {
    const p = vecs[idx];
    const c0 = bucketCoord(p[0], cell);
    const c1 = bucketCoord(p[1], cell);
    const c2 = bucketCoord(p[2], cell);
    const c3 = bucketCoord(p[3], cell);
    const res = [];
    // 4D neighbors: (c±1)^4 => 81 keys
    for (let a = c0 - 1; a <= c0 + 1; a++) {
        for (let b = c1 - 1; b <= c1 + 1; b++) {
            for (let c = c2 - 1; c <= c2 + 1; c++) {
                for (let d = c3 - 1; d <= c3 + 1; d++) {
                    const key = bucketKey4(a, b, c, d);
                    const cand = buckets.get(key);
                    if (!cand)
                        continue;
                    for (const j of cand) {
                        if (distRaw(p, vecs[j]) <= epsRaw)
                            res.push(j);
                    }
                }
            }
        }
    }
    return res;
}
/**
 * DBSCAN with grid bucketing acceleration.
 * - correctness preserved (still checks true distance <= eps)
 * - deterministic (depends only on input ordering)
 * - then enforces 2~5 clusters:
 *   - if >5: keep largest 5
 *   - if <2: fallback split into 2 by v-axis median
 */
export function clusterDBSCAN(points, opts = {}) {
    const eps01 = opts.eps ?? 0.06;
    const minPts = opts.minPts ?? 5;
    const minClusters = opts.minClusters ?? 2;
    const maxClusters = opts.maxClusters ?? 5;
    // convert eps to raw axis distance (distRaw/4 = dist01)
    const epsRaw = eps01 * 4;
    const cell = epsRaw; // cell size = epsRaw is safe for neighbor bucketing
    // pre-extract core vectors for speed
    const vecs = points.map((s) => [s.core.v, s.core.r, s.core.u, s.core.i]);
    const buckets = buildBuckets(vecs, cell);
    const labels = new Array(points.length).fill(0); // 0=unvisited, -1=noise, >0 clusterId
    let clusterId = 0;
    for (let i = 0; i < points.length; i++) {
        if (labels[i] !== 0)
            continue;
        const neigh = regionQueryBucketed(vecs, buckets, i, epsRaw, cell);
        if (neigh.length < minPts) {
            labels[i] = -1;
            continue;
        }
        clusterId++;
        labels[i] = clusterId;
        const queue = [...neigh];
        while (queue.length) {
            const j = queue.shift();
            if (labels[j] === -1)
                labels[j] = clusterId;
            if (labels[j] !== 0)
                continue;
            labels[j] = clusterId;
            const neigh2 = regionQueryBucketed(vecs, buckets, j, epsRaw, cell);
            if (neigh2.length >= minPts) {
                for (const k of neigh2)
                    queue.push(k);
            }
        }
    }
    const clustersMap = new Map();
    const noise = [];
    for (let i = 0; i < points.length; i++) {
        const l = labels[i];
        if (l === -1)
            noise.push(points[i]);
        else if (l > 0) {
            const arr = clustersMap.get(l);
            if (arr)
                arr.push(points[i]);
            else
                clustersMap.set(l, [points[i]]);
        }
        else {
            noise.push(points[i]);
        }
    }
    let clusters = [...clustersMap.entries()]
        .map(([id, members]) => ({ id: `a${id}`, members, center: meanCenter(members) }))
        .sort((a, b) => b.members.length - a.members.length);
    // cap to maxClusters
    if (clusters.length > maxClusters)
        clusters = clusters.slice(0, maxClusters);
    // enforce minClusters via fallback split
    if (clusters.length < minClusters) {
        if (points.length < 2) {
            clusters = [{ id: 'a1', members: points.slice(), center: meanCenter(points) }];
        }
        else {
            const sorted = [...points].sort((x, y) => x.core.v - y.core.v);
            const mid = Math.floor(sorted.length / 2);
            const left = sorted.slice(0, mid);
            const right = sorted.slice(mid);
            clusters = [
                { id: 'a1', members: left, center: meanCenter(left) },
                { id: 'a2', members: right, center: meanCenter(right) },
            ];
        }
    }
    if (clusters.length > maxClusters)
        clusters = clusters.slice(0, maxClusters);
    return { clusters, noise };
}
