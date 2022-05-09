import * as functions from 'firebase-functions'
import { z } from 'zod'
import {
	throwAndLogHttpsError,
	BadCode,
	OnErrorLogging,
	ErrorCode,
} from './throwAndLogHttpsError'
import { NonNullableKey } from './types'
import { Schema, onCallObj } from './exp'

type BadRes = {
	code: BadCode
	message: string
	err?: unknown
}

type GoodReq<S extends Schema, ResData extends z.infer<S['res']>> = {
	code: 'ok'
	data: keyof ResData extends keyof z.infer<S['res']> ? ResData : never // ensure exact object shape
}

type Ret<S extends Schema, ResData extends z.infer<S['res']>> =
	| BadRes
	| GoodReq<S, ResData>

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
 * @param settings.onErrorLogging optional, to log error information, pass a function that receive {@link settings.details.reqData}, {@link settings.details.context}, {@link settings.details.reqZodError}, {@link settings.details.resZodError} and {@link settings.details.err} as argument, and process your error there eg saving log file, the return of the function will be logged. You can return promise.
 * @param config.doNotExport optional, if this is true, then `exp` will not export the function.
 * @param config.functions optional, insert firebase function builder here.
 * @param handler onCall handler, receive request data and callable context as argument
 * @returns object contains name, schema, the created firebase function onCall and config
 */
export const onCall = <
	S extends Schema,
	ResData extends z.infer<S['res']>,
	Handler extends (
		reqData: z.infer<S['req']>,
		context: Rot<Route>
	) => Promise<Ret<S, ResData>> | Ret<S, ResData>,
	Route extends 'private' | 'public'
>(
	schema: S,
	config: {
		route: Route
		onErrorLogging?: OnErrorLogging<
			z.infer<S['req']>,
			z.ZodError<z.infer<S['req']>>,
			z.ZodError<z.infer<S['res']>>,
			ReturnType<Handler> extends Ret<S, ResData>
				? ReturnType<Handler> extends BadRes
					? ReturnType<Handler>['err']
					: never
				: ReturnType<Handler> extends Promise<infer P>
				? P extends Ret<S, ResData>
					? P extends BadRes
						? P['err']
						: never
					: never
				: never
		>
		changeBuiltInErrorCodeAndMessage?: {
			unauthenticated?: {
				code?: ErrorCode
				message?: string
			}
			unknown?: {
				code?: ErrorCode
				message?: string
			}
			resZodError?: {
				code?: ErrorCode
				message?: string
			}
			reqZodError?: {
				code?: ErrorCode
				message?: string
			}
		}
		doNotExport?: boolean
		func?: functions.FunctionBuilder | typeof functions
	},
	handler: Handler
): onCallObj => {
	const { route, onErrorLogging, func, changeBuiltInErrorCodeAndMessage } =
		config
	const onCall = (func || functions).https.onCall(async (data, context) => {
		const reqData = data as z.infer<S['req']>
		// auth validation
		if (!context.auth && route === 'private') {
			await throwAndLogHttpsError({
				code:
					changeBuiltInErrorCodeAndMessage?.unauthenticated?.code ||
					'unauthenticated',
				message:
					changeBuiltInErrorCodeAndMessage?.unauthenticated?.message ||
					'Please Login First',
				details: { reqData, context },
				onErrorLogging,
			})
		}

		try {
			schema.req.parse(reqData)
		} catch (zodError) {
			await throwAndLogHttpsError({
				code:
					changeBuiltInErrorCodeAndMessage?.reqZodError?.code ||
					'invalid-argument',
				message:
					changeBuiltInErrorCodeAndMessage?.reqZodError?.message ||
					'invalid-argument',
				details: {
					reqData,
					context,
					reqZodError: zodError as z.ZodError<z.infer<S['req']>>,
				},
				onErrorLogging,
			})
		}
		const res = await (async () => {
			// change sync/async function to async
			return handler(reqData, context as Rot<Route>)
		})().catch(async err => {
			// throw unknown error
			return throwAndLogHttpsError({
				code: changeBuiltInErrorCodeAndMessage?.unknown?.code || 'unknown',
				message:
					changeBuiltInErrorCodeAndMessage?.unknown?.message || 'unknown',
				details: { reqData, context, err },
				onErrorLogging,
			})
		})
		if (res.code === 'ok') {
			// validate output, rare error
			try {
				schema.res.parse(res.data)
			} catch (zodError) {
				await throwAndLogHttpsError({
					code:
						changeBuiltInErrorCodeAndMessage?.resZodError?.code || 'internal',
					message:
						changeBuiltInErrorCodeAndMessage?.resZodError?.message ||
						'invalid response',
					details: {
						reqData,
						context,
						resZodError: zodError as z.ZodError<z.infer<S['res']>>,
					},
					onErrorLogging,
				})
			}
			return res.data
		} else {
			// thrown known error
			await throwAndLogHttpsError({
				code: res.code,
				details: { reqData, context, err: res.err as never },
				message: res.message,
				onErrorLogging,
			})
		}
	})

	return { onCall, schema, config }
}
