// @ts-ignore
import { onCall } from './onCall'
import env from '../env.json'
import { z } from 'zod'
import fftest from 'firebase-functions-test'
import * as functions from 'firebase-functions'

const test = fftest(
	{
		projectId: env.projects.default,
	},
	'path/to/serviceAccountKey.json'
)

const schema = { req: z.string(), res: z.string(), name: 'test' }

describe('test onCall', () => {
	afterAll(() => {
		test.cleanup()
	})
	it('simple ok sync', async () => {
		const wrapped = test.wrap(
			onCall(
				schema,
				{
					route: 'private',
					func: functions
						.runWith({
							timeoutSeconds: 300,
							memory: '1GB',
						})
						.region('europe-west1'),
				},
				() => {
					return { code: 'ok', data: 'okRes' }
				}
			).onCall
		)
		await expect(wrapped('123', { auth: { uid: '123' } })).resolves.toEqual(
			'okRes'
		)
	})

	it('simple ok async', async () => {
		const wrapped = test.wrap(
			onCall(
				schema,
				{
					route: 'private',
				},
				async () => {
					return { code: 'ok', data: 'okRes' }
				}
			).onCall
		)
		await expect(wrapped('123', { auth: { uid: '123' } })).resolves.toEqual(
			'okRes'
		)
	})

	it('simple bad sync', async () => {
		const wrapped = test.wrap(
			onCall(
				schema,
				{
					route: 'private',
					func: functions
						.runWith({
							timeoutSeconds: 300,
							memory: '1GB',
						})
						.region('europe-west1'),
				},
				() => {
					return { code: 'cancelled', message: 'cancelled' }
				}
			).onCall
		)
		await expect(wrapped('123', { auth: { uid: '123' } })).rejects.toEqual(
			new functions.https.HttpsError('cancelled', 'cancelled')
		)
	})

	it('simple bad async', async () => {
		const wrapped = test.wrap(
			onCall(
				schema,
				{
					route: 'private',
					onErrorLogging: (...args) => {
						return { ...args, logType: 'info' }
					},
				},
				async () => {
					return { code: 'cancelled', message: 'cancelled' }
				}
			).onCall
		)
		await expect(wrapped('123', { auth: { uid: '123' } })).rejects.toEqual(
			new functions.https.HttpsError('cancelled', 'cancelled')
		)
	})

	it('auth failed sync', async () => {
		const wrapped = test.wrap(
			onCall(
				schema,
				{
					route: 'private',
					changeBuiltInErrorCodeAndMessage: {
						unauthenticated: { code: 'aborted', message: 'aborted' },
					},
				},
				() => {
					return { code: 'ok', data: 'okRes' }
				}
			).onCall
		)
		await expect(wrapped('123')).rejects.toEqual(
			new functions.https.HttpsError('aborted', 'aborted')
		)
	})

	it('auth failed async', async () => {
		const wrapped = test.wrap(
			onCall(
				schema,
				{
					route: 'private',
				},
				async () => {
					return { code: 'ok', data: 'okRes' }
				}
			).onCall
		)
		await expect(wrapped('123')).rejects.toEqual(
			new functions.https.HttpsError('unauthenticated', 'Please Login First')
		)
	})

	it('unknown failed sync', async () => {
		const wrapped = test.wrap(
			onCall(schema, { route: 'public' }, () => {
				throw 'something'
			}).onCall
		)
		await expect(wrapped('123')).rejects.toEqual(
			new functions.https.HttpsError('unknown', 'unknown')
		)
	})

	it('unknown failed async', async () => {
		const wrapped = test.wrap(
			onCall(
				schema,
				{
					route: 'public',
					changeBuiltInErrorCodeAndMessage: {
						unknown: { code: 'aborted', message: 'aborted' },
					},
				},
				async () => {
					throw 'something'
				}
			).onCall
		)
		await expect(wrapped('123')).rejects.toEqual(
			new functions.https.HttpsError('aborted', 'aborted')
		)
	})

	it('request failed sync', async () => {
		const wrapped = test.wrap(
			onCall(
				schema,
				{
					route: 'public',
					changeBuiltInErrorCodeAndMessage: {
						reqZodError: { code: 'aborted', message: 'aborted' },
					},
				},
				() => {
					return { code: 'ok', data: 'ok' }
				}
			).onCall
		)
		await expect(wrapped(123)).rejects.toEqual(
			new functions.https.HttpsError('aborted', 'aborted')
		)
	})

	it('request failed async', async () => {
		const wrapped = test.wrap(
			onCall(
				schema,
				{
					route: 'public',
				},
				async () => {
					return { code: 'ok', data: 'ok' }
				}
			).onCall
		)
		await expect(wrapped(123)).rejects.toEqual(
			new functions.https.HttpsError('invalid-argument', 'invalid-argument')
		)
	})

	it('response failed sync', async () => {
		const wrapped = test.wrap(
			onCall(
				schema,
				{
					route: 'public',
				},
				// @ts-expect-error
				() => {
					return { code: 'ok', data: 123 }
				}
			).onCall
		)
		await expect(wrapped('123')).rejects.toEqual(
			new functions.https.HttpsError('internal', 'invalid response')
		)
	})

	it('response failed async', async () => {
		const wrapped = test.wrap(
			onCall(
				schema,
				{
					route: 'public',
					changeBuiltInErrorCodeAndMessage: {
						resZodError: { code: 'aborted', message: 'aborted' },
					},
				},
				// @ts-expect-error
				async () => {
					return { code: 'ok', data: 123 }
				}
			).onCall
		)
		await expect(wrapped('123')).rejects.toEqual(
			new functions.https.HttpsError('aborted', 'aborted')
		)
	})
})
