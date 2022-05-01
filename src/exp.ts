import * as functions from 'firebase-functions'
import { z, ZodType, ZodTypeDef } from 'zod'

export type Schema = {
	req: ZodType<unknown, ZodTypeDef, unknown>
	res: ZodType<unknown, ZodTypeDef, unknown>
	name: z.ZodLiteral<string>
}

export const onCallObjArr: {
	onCall: functions.HttpsFunction & functions.Runnable<unknown>
	schema: Schema
	doNotExport?: boolean
}[] = []

/**
 * dynamically exports function
 */
export const exp = () => {
	const nameLookup: Record<string, boolean> = {}
	onCallObjArr.forEach(item => {
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
		exports[value] = onCall
	})
}
