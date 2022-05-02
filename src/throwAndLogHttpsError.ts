import * as functions from 'firebase-functions'
import { ExcludeUnion } from './types'

export type Details<ReqData, ReqZodError, ResZodError, Err> = {
	reqData: ReqData
	context: functions.https.CallableContext
	reqZodError?: ReqZodError
	resZodError?: ResZodError
	err?: Err
}

export type BadCode = ExcludeUnion<functions.https.FunctionsErrorCode, 'ok'>

export type LogType = 'log' | 'info' | 'warn' | 'error'

/**
 * throw and log https error using functions.logger and functions.https.HttpsError
 * @param settings logger setting and information to log
 * @param settings.code error code
 * @param settings.message error message
 * @param settings.details contain {@link settings.details.reqData}, {@link settings.details.context}, {@link settings.details.zodError} and {@link settings.details.err} to log
 * @param settings.details.reqData reqData receive from callable
 * @param settings.details.context callable context object
 * @param settings.details.zodError optional, zod validation error
 * @param settings.details.err optional error object
 * @param settings.logType optional, 'log' | 'info' | 'warn' | 'error', default is 'error'
 * @param settings.onErrorLogging optional, leave it empty(undefined) or set as true to automatically log {@link settings.details.reqData}, {@link settings.details.context} and {@link settings.details.zodError}(if available). Assign false to not log any of it. You can pass a function that receive {@link settings.details.reqData}, {@link settings.details.context} and {@link settings.details.zodError} as argument, and process your error there eg saving log file), the return of the function be logged.
 * @return never, error thrown with what define in {@link settings.code} adn {@link settings.message}
 */
export const throwAndLogHttpsError = async <
	ReqData,
	Err,
	ReqZodError = undefined,
	ResZodError = undefined
>(settings: {
	code: ExcludeUnion<functions.https.FunctionsErrorCode, 'ok'>
	message: string
	details: Details<ReqData, ReqZodError, ResZodError, Err>
	logType?: 'log' | 'info' | 'warn' | 'error'
	onErrorLogging?:
		| boolean
		| ((details: {
				reqData: ReqData
				context: functions.https.CallableContext
				reqZodError?: ReqZodError
				resZodError?: ResZodError
				err?: Err | undefined
		  }) => Promise<unknown> | unknown)
}) => {
	const { code, message, details, logType, onErrorLogging } = settings
	functions.logger[logType || 'error']({
		code,
		message,
		details:
			typeof onErrorLogging === 'function'
				? { fromOnLoggingCallback: await onErrorLogging(details) }
				: onErrorLogging === undefined || onErrorLogging === true
				? details
				: undefined,
	})
	throw new functions.https.HttpsError(code, message)
}
