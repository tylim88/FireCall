import * as functions from 'firebase-functions'
import { z, ZodType, ZodTypeDef } from 'zod'

export type Schema = {
	req: ZodType<unknown, ZodTypeDef, unknown>
	res: ZodType<unknown, ZodTypeDef, unknown>
	name: z.ZodLiteral<string>
}

export type onCallObj = {
	onCall: functions.HttpsFunction & functions.Runnable<unknown>
	schema: Schema
	doNotExport?: boolean
}

/**
 * dynamically exports function
 */
export const exp = (
	obj: Record<
		string,
		{
			onCall: functions.HttpsFunction & functions.Runnable<unknown>
			schema: Schema
			doNotExport?: boolean
		}
	>
) => {
	const nameLookup: Record<string, boolean> = {}
	const arr: onCallObj[] = []
	for (const prop in obj) {
		arr.push(obj[prop] as onCallObj)
	}

	const newArr = arr
		.map(item => {
			const {
				schema: {
					name: { value },
				},
				doNotExport,
				onCall,
			} = item
			if (doNotExport) return
			if (nameLookup[value]) {
				throw Error(`Duplicated Function Name ${value}`)
			} else {
				nameLookup[value] = true
			}
			return { name: value, onCall }
		})
		.filter(item => !!item)

	type Arr = (typeof newArr extends (infer A)[] ? NonNullable<A> : never)[]

	return newArr as Arr
}
