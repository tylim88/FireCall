import { exp } from './exp'
import { onCall } from './onCall'
import { z } from 'zod'
const schema = { req: z.string(), res: z.string(), name: 'one' }
const one = onCall(schema, { route: 'public' }, () => {
	return { code: 'ok', data: '123' }
})
const two = onCall(schema, { route: 'public', doNotExport: true }, () => {
	return { code: 'ok', data: '123' }
})
const three = onCall(schema, { route: 'public' }, () => {
	return { code: 'ok', data: '123' }
})
describe('test exp', () => {
	it('all exp tests', () => {
		expect(exp({ one, two })).toEqual([{ name: 'one', onCall: one.onCall }])
		expect(() => exp({ one, two, three })).toThrow()
	})
})
