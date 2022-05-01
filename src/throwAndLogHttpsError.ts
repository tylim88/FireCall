import * as functions from 'firebase-functions'
import { ExcludeUnion } from './types'
import { z } from 'zod'

export type Details<RequestData, ErrorObj, ZodError> = {
	requestData: RequestData
	context: functions.https.CallableContext
	zodError?: z.ZodError<ZodError>
	errorObj?: Record<string, ErrorObj>
}

/**
 * throw and log https error using functions.logger and functions.https.HttpsError
 * @param settings logger setting and information to log
 * @param settings.code error code
 * @param settings.message error message
 * @param settings.details contain {@link settings.details.requestData}, {@link settings.details.context}, {@link settings.details.zodError} and {@link settings.details.errorObj} to log
 * @param settings.details.requestData requestData receive from callable
 * @param settings.details.context callable context object
 * @param settings.details.zodError optional, zod validation error
 * @param settings.details.errorObj optional error object
 * @param settings.logType optional, 'log' | 'info' | 'warn' | 'error', default is 'error'
 * @param settings.onLogging optional, leave it empty to automatically log {@link settings.details.requestData}, {@link settings.details.context} and {@link settings.details.zodError}(if available). You can pass a function that receive {@link settings.details.requestData}, {@link settings.details.context} and {@link settings.details.zodError} as argument, and log what the function returns.
 * @return never, error thrown with what define in {@link settings.code} adn {@link settings.message}
 */
export const throwAndLogHttpsError = async <
	RequestData,
	ErrorObj,
	ZodError = undefined
>(settings: {
	code: ExcludeUnion<functions.https.FunctionsErrorCode, 'ok'>
	message: string
	details: Details<RequestData, ErrorObj, ZodError>
	logType?: 'log' | 'info' | 'warn' | 'error'
	onLogging?: (details: {
		requestData: RequestData
		context: functions.https.CallableContext
		zodError?: z.ZodError<ZodError>
		errorObj?: Record<string, ErrorObj>
	}) => Promise<unknown>
}) => {
	const { code, message, details, logType, onLogging } = settings
	functions.logger[logType || 'error']({
		code,
		message,
		details: onLogging
			? { fromOnLoggingCallback: await onLogging(details) }
			: details,
	})
	throw new functions.https.HttpsError(code, message)
}
