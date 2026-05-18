import { useEffect, useState } from "react";

const cache = new Map();

function useCachedState<T>(key: string): [ T | undefined, React.Dispatch<React.SetStateAction<T>> ];
function useCachedState<T>(key: string, initialValue: T): [ T, React.Dispatch<React.SetStateAction<T>> ];
function useCachedState<T>(key: string, initialValue?: T): [ T, React.Dispatch<React.SetStateAction<T>> ] {
    const [ state, setState ] = useState<T>(() => {
        if (cache.has(key)) {
            return cache.get(key);
        }

        return typeof initialValue === "function" ? initialValue() : initialValue;
    });

    useEffect(() => {
        cache.set(key, state);
    }, [key, state]);

    return [state, setState];
}

export { useCachedState };