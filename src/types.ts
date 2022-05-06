export type OmitKeys<T, K extends keyof T> = Omit<T, K>

export type ExcludeUnion<T, U extends T> = Exclude<T, U>

export type NonNullableKey<T, K extends keyof T> = OmitKeys<T, K> &
	Required<{
		[index in K]: T[K]
	}>

export const IsTrue = <T extends true>() => {} // for type assertion, normally use with IsSame or IEqual

// https://stackoverflow.com/questions/53807517/how-to-test-if-two-types-are-exactly-the-same
export type IsSame<T, U> = (<G>() => G extends T ? 1 : 2) extends <
	G
>() => G extends U ? 1 : 2
	? true
	: false

export type IsEqual<T, U> = T extends U ? (U extends T ? true : false) : false
