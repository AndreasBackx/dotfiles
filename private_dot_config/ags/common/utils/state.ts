export type StateAccessor<T> = {
  (): T
  <R>(map: (value: T) => R): R
  get(): T
}
