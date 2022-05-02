import * as functions from 'firebase-functions'
import { ZodType, ZodTypeDef } from 'zod'

export type Schema = {
	req: ZodType<unknown, ZodTypeDef, unknown>
	res: ZodType<unknown, ZodTypeDef, unknown>
	name: string
}

export type onCallObj = {
	onCall: functions.HttpsFunction & functions.Runnable<unknown>
	schema: Schema
	config: { doNotExport?: boolean }
}

/**
 * dynamically exports function
 */
export const exp = (obj: Record<string, onCallObj>) => {
	const nameLookup: Record<string, boolean> = {}
	const arr: onCallObj[] = []
	for (const prop in obj) {
		arr.push(obj[prop] as onCallObj)
	}

	const newArr = arr
		.map(item => {
			const {
				schema: { name },
				config: { doNotExport },
				onCall,
			} = item
			if (doNotExport) return
			if (nameLookup[name]) {
				throw Error(`Duplicated Function Name ${name}`)
			} else {
				nameLookup[name] = true
			}
			return { name, onCall }
		})
		.filter(item => !!item)

	type Arr = (typeof newArr extends (infer A)[] ? NonNullable<A> : never)[]

	return newArr as Arr
}
