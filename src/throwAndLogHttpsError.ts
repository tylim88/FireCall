import * as functions from 'firebase-functions'
import { ExcludeUnion } from './types'
import { z } from 'zod'

export type Details<RequestData, Err, ZodError> = {
	requestData: RequestData
	context: functions.https.CallableContext
	zodError?: z.ZodError<ZodError>
	err?: Err
}

/**
 * throw and log https error using functions.logger and functions.https.HttpsError
 * @param settings logger setting and information to log
 * @param settings.code error code
 * @param settings.message error message
 * @param settings.details contain {@link settings.details.requestData}, {@link settings.details.context}, {@link settings.details.zodError} and {@link settings.details.err} to log
 * @param settings.details.requestData requestData receive from callable
 * @param settings.details.context callable context object
 * @param settings.details.zodError optional, zod validation error
 * @param settings.details.err optional error object
 * @param settings.logType optional, 'log' | 'info' | 'warn' | 'error', default is 'error'
 * @param settings.onLogging optional, leave it empty(undefined) or set as true to automatically log {@link settings.details.requestData}, {@link settings.details.context} and {@link settings.details.zodError}(if available). Assign false to not log any of it. You can pass a function that receive {@link settings.details.requestData}, {@link settings.details.context} and {@link settings.details.zodError} as argument, and process your error there eg saving log file), the return of the function be logged.
 * @return never, error thrown with what define in {@link settings.code} adn {@link settings.message}
 */
export const throwAndLogHttpsError = async <
	RequestData,
	Err,
	ZodError = undefined
>(settings: {
	code: ExcludeUnion<functions.https.FunctionsErrorCode, 'ok'>
	message: string
	details: Details<RequestData, Err, ZodError>
	logType?: 'log' | 'info' | 'warn' | 'error'
	onLogging?:
		| boolean
		| ((details: {
				requestData: RequestData
				context: functions.https.CallableContext
				zodError?: z.ZodError<ZodError>
				err?: Err | undefined
		  }) => Promise<unknown> | unknown)
}) => {
	const { code, message, details, logType, onLogging } = settings
	functions.logger[logType || 'error']({
		code,
		message,
		details:
			typeof onLogging === 'function'
				? { fromOnLoggingCallback: await onLogging(details) }
				: onLogging === undefined || onLogging === true
				? details
				: undefined,
	})
	throw new functions.https.HttpsError(code, message)
}
