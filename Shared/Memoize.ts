export function memoize<T, R>(f: (oneParam: T) => R): (oneParam: T) => R {
    const cached: Map<T, R> = new Map();

    return (param: T) => {
        if (cached.has(param)) return cached.get(param)!;

        const r = f(param);
        cached.set(param, r);
        return r;
    }
}