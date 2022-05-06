import { onCall } from './onCall'
import { z } from 'zod'
import { IsTrue, IsSame } from './types'

describe('test some types', () => {
	it('check onErrorLogging type', () => {
		const errObj = 12121245 as const
		;() =>
			onCall(
				{ name: 'experiment', req: z.string(), res: z.string() },
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
					return { code: 'aborted', message: '', err: errObj }
				}
			)
	})
})
