import * as functions from 'firebase-functions'
import { z } from 'zod'
import { throwAndLogHttpsError } from './throwAndLogHttpsError'
import { NonNullableKey, OmitKeys } from './types'
import { Schema, onCallObj } from './exp'

type Ret<S extends Schema, ResData extends z.infer<S['res']>> =
	| (OmitKeys<
			Parameters<typeof throwAndLogHttpsError>[0],
			'onLogging' | 'details'
	  > & { err?: Record<string, unknown> })
	| {
			code: 'ok'
			data: keyof ResData extends keyof z.infer<S['res']> ? ResData : never // ensure exact object shape
	  }

type Rot<Route extends 'private' | 'public'> = Route extends 'private'
	? NonNullableKey<functions.https.CallableContext, 'auth'>
	: Route extends 'public'
	? functions.https.CallableContext
	: never

/**
 *
 * @param schema object that contains request data and response data zod schema, and the function name
 * @param schema.req request data zod schema
 * @param schema.res response data zod schema
 * @param schema.name name of the function
 * @param config functions setting
 * @param config.route private route or public route, private = need authentication, public = not need authentication.
 * @param config.onLogging optional, leave it empty(undefined) or set as true to automatically log {@link settings.details.requestData}, {@link settings.details.context} and {@link settings.details.zodError}(if available). Assign false to not log any of it. You can pass a function that receive {@link settings.details.requestData}, {@link settings.details.context} and {@link settings.details.zodError} as argument, and process your error there eg saving log file), the return of the function be logged.
 * @param config.doNotExport optional, if this is true, then `exp` will not export the function.
 * @param config.functions optional, insert firebase function builder here.
 * @param handler onCall handler, receive request data and callable context as argument
 * @returns object contains name, schema, the created firebase function onCall and config
 */
export const onCall = <
	S extends Schema,
	ResData extends z.infer<S['res']>,
	Return extends { ok: functions.https.FunctionsErrorCode },
	Route extends 'private' | 'public'
>(
	schema: S,
	config: {
		route: Route
		onLogging?: Parameters<typeof throwAndLogHttpsError>[0]['onLogging']
		doNotExport?: boolean
		functions?: functions.FunctionBuilder | typeof functions
	},
	handler: (
		reqData: z.infer<S['req']>,
		context: Rot<Route>
	) => Return extends never
		? Return
		: Promise<Ret<S, ResData>> | Ret<S, ResData>
): onCallObj => {
	const { route, onLogging, functions: functionBuilder } = config
	const onCall = (functionBuilder || functions).https.onCall(
		async (data, context) => {
			const requestData = data as z.infer<S['req']>
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

			const res = await Promise.resolve(
				handler(requestData, context as Rot<Route>)
			).catch(err => {
				// throw unknown error
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

	return { onCall, schema, config }
}
