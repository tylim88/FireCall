import { onCall } from './onCall'
import { z } from 'zod'
export const experiment = onCall(
	{ name: 'experiment', req: z.string(), res: z.string() },
	{
		route: 'private',
		onErrorLogging: ({ context, reqData, reqZodError, resZodError, err }) => {
			return { context, reqData, reqZodError, resZodError, err }
		},
	},
	async () => {
		return { code: 'aborted', message: '', err: 12121245 as const }
	}
)
