// Ensures that the given properties of T are present in the resulting type
type Ensured<T, U extends keyof T> = Required<Pick<T, U>> & Omit<T, U>;

export type {
    Ensured
};
