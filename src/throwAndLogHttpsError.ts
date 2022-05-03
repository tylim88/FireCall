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

export type OnErrorLogging<ReqData, ReqZodError, ResZodError, Err> = (
	details: {
		code: ExcludeUnion<functions.https.FunctionsErrorCode, 'ok'>
		message: string
	} & Details<ReqData, ReqZodError, ResZodError, Err>
) => unknown

export type ErrorCode = ExcludeUnion<functions.https.FunctionsErrorCode, 'ok'>

/**
 * throw and log https error using functions.logger and functions.https.HttpsError
 * @param settings logger setting and information to log
 * @param settings.code error code
 * @param settings.message error message
 * @param settings.details contain {@link settings.details.reqData}, {@link settings.details.context}, {@link settings.details.zodError} and {@link settings.details.err} to log
 * @param settings.details.reqData reqData receive from callable
 * @param settings.details.context callable context object
 * @param settings.details.reqZodError optional, request data zod validation error
 * @param settings.details.resZodError optional, response data zod validation error
 * @param settings.details.err optional user defined error object
 * @param settings.logType optional, 'log' | 'info' | 'warn' | 'error', default is 'error'
 * @param settings.onErrorLogging optional, to log error information, pass a function that receive {@link settings.details.reqData}, {@link settings.details.context}, {@link settings.details.reqZodError}, {@link settings.details.resZodError} and {@link settings.details.err} as argument, and process your error there eg saving log file, the return of the function will be logged. You can return promise.
 * @return never, error thrown with what define in {@link settings.code} adn {@link settings.message}
 */
export const throwAndLogHttpsError = async <
	ReqData,
	Err,
	ReqZodError = undefined,
	ResZodError = undefined
>(settings: {
	code: ErrorCode
	message: string
	details: Details<ReqData, ReqZodError, ResZodError, Err>
	logType?: 'log' | 'info' | 'warn' | 'error'
	onErrorLogging?: OnErrorLogging<ReqData, ReqZodError, ResZodError, Err>
}) => {
	const { code, message, details, logType, onErrorLogging } = settings
	functions.logger[logType || 'error']({
		code,
		message,
		details: onErrorLogging
			? await onErrorLogging({ code, message, ...details })
			: 'no logging available',
	})
	throw new functions.https.HttpsError(code, message)
}
