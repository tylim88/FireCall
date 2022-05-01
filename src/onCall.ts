import * as functions from 'firebase-functions'
import { z } from 'zod'
import { throwAndLogHttpsError } from './throwAndLogHttpsError'
import { NonNullableKey, OmitKeys } from './types'
import { Schema } from './exp'

// standardize the way of data validation, auth checking and error handling
export const onCall = <
	T extends Schema,
	Q extends z.infer<T['res']>,
	R extends { ok: functions.https.FunctionsErrorCode },
	A extends 'private' | 'public'
>(
	schema: T,
	config: {
		route: A
		onLogging?: Parameters<typeof throwAndLogHttpsError>[0]['onLogging']
		doNotExport?: boolean
		functions?: functions.FunctionBuilder | typeof functions
	},
	handler: (
		reqData: z.infer<T['req']>,
		context: A extends 'private'
			? NonNullableKey<functions.https.CallableContext, 'auth'>
			: A extends 'public'
			? OmitKeys<functions.https.CallableContext, 'auth'>
			: never
	) => Promise<
		R extends never
			? R
			:
					| (OmitKeys<
							Parameters<typeof throwAndLogHttpsError>[0],
							'onLogging' | 'details'
					  > & { err?: Record<string, unknown> })
					| {
							code: 'ok'
							data: keyof Q extends keyof z.infer<T['res']> ? Q : never // ensure exact object shape
					  }
	>
) => {
	const { route, onLogging, doNotExport, functions: functionBuilder } = config
	const onCall = (functionBuilder || functions).https.onCall(
		async (data, context) => {
			const requestData = data as z.infer<T['req']>
			// auth validation
			if (!context.auth && route === 'private') {
				throwAndLogHttpsError({
					code: 'unauthenticated',
					message: 'Please Login First',
					details: { requestData, context },
					onLogging,
				})
			}

			// data validation
			try {
				schema.req.parse(requestData)
			} catch (zodError) {
				throwAndLogHttpsError({
					code: 'invalid-argument',
					message: 'invalid-argument',
					details: { requestData, context, zodError: zodError as z.ZodError },
					onLogging,
				})
			}

			const res = await handler(
				requestData,
				// @ts-expect-error
				context
			).catch(err => {
				// unknown error
				return throwAndLogHttpsError({
					code: 'unknown',
					message: 'unknown error',
					details: { requestData, context, err },
					onLogging,
				})
			})
			if (res.code === 'ok') {
				// validate output, rare error
				try {
					schema.res.parse(res.data)
				} catch (zodError) {
					throwAndLogHttpsError({
						code: 'internal',
						message: 'output data malformed',
						details: { requestData, context, zodError: zodError as z.ZodError },
						onLogging,
					})
				}
				return res.data
			} else {
				// thrown known error
				throwAndLogHttpsError({
					code: res.code,
					details: { requestData, context, err: res.err },
					message: res.message,
					logType: res.logType,
					onLogging,
				})
			}
		}
	)

	return { onCall, schema, doNotExport }
}
