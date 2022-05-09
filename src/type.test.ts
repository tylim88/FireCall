import { onCall } from './onCall'
import { z } from 'zod'
import { IsTrue, IsSame } from './types'

const schema = { name: 'experiment', req: z.string(), res: z.string() }

describe('test types', () => {
	it('check onErrorLogging err type', () => {
		const errObj = 12121245 as const
		;() =>
			onCall(
				schema,
				{
					route: 'private',
					onErrorLogging: ({
						context,
						reqData,
						reqZodError,
						resZodError,
						err,
					}) => {
						IsTrue<IsSame<typeof err, typeof errObj | undefined>>()
						return { context, reqData, reqZodError, resZodError, err }
					},
				},
				async () => {
					const a = true
					if (a) {
						return { code: 'aborted', message: '', err: errObj }
					} else {
						return { code: 'ok', data: '123' }
					}
				}
			)

		onCall(
			schema,
			{
				route: 'private',
			},
			// @ts-expect-error
			async () => {
				return { code: 'aborted', data: '123' }
			}
		)

		onCall(
			schema,
			{
				route: 'private',
			},
			// @ts-expect-error
			async () => {
				return { code: 'ok', data: 123 }
			}
		)
	})
})
