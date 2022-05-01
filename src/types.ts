export type OmitKeys<T, K extends keyof T> = Omit<T, K>

export type ExcludeUnion<T, U extends T> = Exclude<T, U>

export type NonNullableKey<T, K extends keyof T> = OmitKeys<T, K> &
	Required<{
		[index in K]: T[K]
	}>
