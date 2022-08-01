<!-- markdownlint-disable MD010 -->
<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD041 -->

<div align="center">
		<img src="https://raw.githubusercontent.com/tylim88/Firelord/main/img/ozai.png" width="200px"/>
		<h1>FireCall 烈火唤</h1>
</div>

<div align="center">
		<a href="https://www.npmjs.com/package/firecall" target="_blank">
				<img
					src="https://img.shields.io/npm/v/firecall"
					alt="Created by tylim88"
				/>
			</a>
			&nbsp;
			<a
				href="https://github.com/tylim88/firecall/blob/main/LICENSE"
				target="_blank"
			>
				<img
					src="https://img.shields.io/github/license/tylim88/firecall"
					alt="License"
				/>
			</a>
			&nbsp;
			<a
				href="https://www.npmjs.com/package/firecall?activeTab=dependencies"
				target="_blank"
			>
				<img
					src="https://img.shields.io/badge/dynamic/json?url=https://api.npmutil.com/package/firecall&label=dependencies&query=$.dependencies.count&color=brightgreen"
					alt="dependency count"
				/>
			</a>
			&nbsp;
			<img
				src="https://img.shields.io/badge/gzipped-2KB-brightgreen"
				alt="package size"
			/>
			&nbsp;
			<a href="https://github.com/tylim88/FireCall/actions" target="_blank">
				<img
					src="https://github.com/tylim88/FireCall/workflows/Main/badge.svg"
					alt="github action"
				/>
			</a>
			&nbsp;
			<a href="https://codecov.io/gh/tylim88/FireCall" target="_blank">
				<img
					src="https://codecov.io/gh/tylim88/FireCall/branch/main/graph/badge.svg"
					alt="code coverage"
				/>
			</a>
			&nbsp;
			<a href="https://github.com/tylim88/FireCall/issues" target="_blank">
				<img
					alt="GitHub issues"
					src="https://img.shields.io/github/issues-raw/tylim88/FireCall"
				></img>
			</a>
			&nbsp;
			<a href="https://snyk.io/test/github/tylim88/FirelordJS" target="_blank">
				<img
					src="https://snyk.io/test/github/tylim88/FirelordJS/badge.svg"
					alt="code coverage"
				/>
			</a>
			&nbsp;
			<a
				href="https://lgtm.com/projects/g/tylim88/FireCall/alerts/"
				target="_blank"
			>
				<img
					alt="Total alerts"
					src="https://img.shields.io/lgtm/alerts/g/tylim88/FireCall.svg?logo=lgtm&logoWidth=18"
				/>
			</a>
			&nbsp;
			<a
				href="https://lgtm.com/projects/g/tylim88/FireCall/context:javascript"
				target="_blank"
			>
				<img
					alt="Language grade: JavaScript"
					src="https://img.shields.io/lgtm/grade/javascript/g/tylim88/FireCall.svg?logo=lgtm&logoWidth=18"
				/>
			</a>
			<br/>
			<br/>
			<p>🔥 Write callable functions systematically like a Firelord. No more chaotic error handling, no more unsafe endpoint data type, no more messy validation. Be the Master of Fire you always wanted to be.</p>
</div>
<br/>
<br/>
FireCall standardizes how functions should handle:

- Unauthorized Authentication Error
- User defined error
- Unknown Error
- Invalid Request Data Error (ZodError)
- Invalid Response Data Error (ZodError)
- Validate Request Data With Zod
- Validate Response Data With Zod
- error logging (only log the error, does not save the error into a file)

Guarantee:

- Standard HTTPS Error.
- Data type safety for both ends.(with Firecaller)
- function name correctness for both ends.(with Firecaller)

Optional: For maximum benefit, please use [FireCaller](https://github.com/tylim88/firecaller) in front end.

support [firebase-functions-test](#firebase-function-test):

## Why Do You Need This? What Is The Problem FireCall Trying To Solve?

When coding a callable function (or any endpoint in general), we need to deal with 5 basic errors, which is basically 99% of your errors, the rest are system errors.

1. Unauthenticated error (only for protected route)
2. invalid request data error
3. invalid response data error (this is needed if we want to prevent unnecessary data send to front end)
4. developer defined error, whatever developer do and whatever error he want to throw
5. unknown error that happen for whatever reason (basically error that is not taken care by developer)

Error handling is chaotic, error handling is hard, error handling make you go nut.

Some developer return error as 200 response and attach his own error code and message as data, now imagine every developer return his unique format of error, this is not fun.

With FireCall, no more "you return your error, I return my error, he return his error", everybody simply return a god damn standard HTTPS error.

FireCall standardize the way of handling these errors, there is only ONE way.

There is also one common issue where developer often calling the wrong function name which lead to CORS error, basically front end and backend are not tally with each other.

So to solve this is we prepare a schema and share it to both front end and back end, by doing this not only we make sure that the function name is correct, but also we make sure that the data type is correct.

It is very similar to how Graphql schema sharing works, but way much simpler and we all know how convoluted Graphql is.

Long thing short, FireCall make sure that there is only one way to do stuff and providing you absolute type safe at both compile and run time with single source of truth(zod).

## Installation

```bash
npm i firecall zod firebase-functions regenerator-runtime
```

and of course you need `typescript`.

Add this to your very first line of code

```ts
import 'regenerator-runtime/runtime'
```

You only need to add this line once

## Create Schema With Zod

First, you need to create schema with `zod`, you can share this file to front end and use [FireCaller](https://github.com/tylim88/FireCaller) with it.

FireCall can works without FireCaller on front end but it is recommended to use FireCaller with it or else there is no point sharing schema to front end.

```ts
import { z } from 'zod'

export const updateUserSchema = {
	//request data schema
	req: z.object({
		name: z.string(),
		age: z.number(),
		address: z.string(),
	}),
	// response data schema
	res: z.undefined(),
	// function name
	name: 'updateUser',
}

export const getUserSchema = {
	//request data schema
	req: z.string(), // userId
	// response data schema
	res: z.object({
		name: z.string(),
		age: z.number(),
	}),
	name: 'getUser',
}
```

`req`: request data schema  
`res`: response data schema  
`name`: onCall function name

## Create the onCall Functions

```ts
import { updateUserSchema, getUserSchema } from './someFiles'
import { onCall } from 'firecall'

// use any variable name you want
const updateUser = onCall(
	updateUserSchema,
	{ route: 'private' }, // 'private' for protected route
	// handler
	async (data, context) => {
		const { name, age, address } = data // request data is what you define in schema.req
		const {
			auth: { uid }, // if route is protected, auth object is not undefined
		} = context

		try {
			await updateWithSomeDatabase({ uid, name, age, address })
			return { code: 'ok', data: undefined } // response data is what you define in schema.res
		} catch (err) {
			// in case you are not catching any error, FireCall will also throw unknown error
			return {
				code: 'unknown',
				message: 'update user failed',
				err,
			}
		}
	}
)

const getUser = onCall(
	getUserSchema,
	{ route: 'public' }, // 'public' for unprotected route
	// handler
	async data => {
		const uid = data // request data is what you define in schema.req

		try {
			const { name, age, secret } = await getUserFromDatabase({
				uid,
			})
			return { code: 'ok', data: { name, age } } // response data is what you define in schema.res
		} catch (err) {
			// in case you are not catching any error, FireCall will also throw unknown error
			return {
				code: 'unknown',
				message: 'get user failed',
				err,
			}
		}
	}
)
```

If the response is ok, handler must return object with `code` and `data` property, where  
`code`: `ok`  
`data`: value that has same type as type you define in schema.res

if the response is not `ok`, handler must return object with `code` and `message` properties, and an optional `err` property, where  
`code`: [Firebase Functions Error Code](https://firebase.google.com/docs/reference/node/firebase.functions#functionserrorcode) except 'ok'  
`message`: string  
`err`?: **user defined error**, put anything you want here, normally the error object or just skip it

## Export Functions

This is helper function to export functions. Since function name is now an object property, we need a runtime check(deploy phase runtime) to make sure each function name is unique and throw error if duplicate found.

```ts
import { updateUser, getUser } from './someOtherFile'
import { exp } from 'firecall'

exp({ updateUser, getUser }).forEach(func => {
	const { name, onCall } = func
	exports[name] = onCall
})
```

If everything in `someOtherFile` is FireCall function, you can write something like this

```ts
import * as allFunc from './someOtherFile'
import { exp } from 'firecall'

exp(allFunc).forEach(func => {
	const { name, onCall } = func
	exports[name] = onCall
})
```

## Firebase Function Test

You can use FireCall with [firebase-functions-test](https://firebase.google.com/docs/functions/unit-testing):

ok test example:

```ts
const wrapped = test.wrap(
	onCall(
		schema,
		{
			route: 'private',
		},
		async () => {
			return { code: 'ok', data: 'okie' }
		}
	).onCall
)
await expect(wrapped('someData', { auth: { uid: '123' } })).resolves.toEqual(
	'okie'
)
```

error test examples:

```ts
const wrapped = test.wrap(
	onCall(
		schema,
		{
			route: 'private',
		},
		() => {
			return { code: 'cancelled', message: 'cancelled' }
		}
	).onCall
)
await expect(wrapped('someData', { auth: { uid: '123' } })).rejects.toEqual(
	new functions.https.HttpsError('cancelled', 'cancelled')
)

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
await expect(wrapped('someData')).rejects.toEqual(
	new functions.https.HttpsError('unauthenticated', 'Please Login First')
)
```

## Const Assertion

You can use const assertion if the handler is returning response from another callback, example from the transaction.

```ts
import { onCall } from 'firecall'

export const someFun = onCall(someSchema, { route: 'private' }, async () => {
	// return the transaction
	return await db.runTransaction(async transaction => {
		return { code: 'ok', data: null } as const // do const assertion here
	})
})
```

## Function Builder

If you need custom setting for you function like changing ram or region, you can pass function builder to `onCall` config.

```ts
import * as functions from 'firebase-functions'
import { onCall } from 'firecall'

const someFunc = onCall(
	someSchema,
	{
		route: 'public', // route is not optional, you can use either 'public' or 'private' value
		func: functions
			.runWith({
				timeoutSeconds: 300,
				memory: '1GB',
			})
			.region('europe-west1'),
	},
	handler
)
```

`func` accept `functions` or `functions.FunctionBuilder`

## Error Logging

By default, FireCall does not log anything.

Pass a function to config.onErrorLogging if you want to log:

```ts
const someFunc = onCall(
	someSchema,
	{
		route: 'public', // route is not optional, you can use either 'public' or 'private' value
		config: {
			onErrorLogging: ({ context, reqData, reqZodError, resZodError, err }) => {
				// you can do something else here, eg save error to file

				// example of what you can return
				return undefined // no logging, default behavior
				return { abc: reqData } //  will log { abc: reqData }
				return { logType: 'info', abc: reqData } // will log { abc: reqData }, the log type is info
			},
		},
	},
	handler
)
```

`onErrorLogging`?: `({ reqData, context, reqZodError?, resZodError?, err? }) => (Record<string,unknown> & { logType?: 'log' | 'info' | 'warn' | 'error' }) | undefined`

`reqData`: the request data  
`context`: Firebase function context callable  
`reqZodError`: may exist, the error that occurs when trying to parse the request data  
`resZodError`: may exist, the error that occurs when trying to parse the response data  
`err`: may exist, it is the **user defined error** you return to the handler(the response). Its type is unknown until there is user defined error in the response, which mean you don't need to type cast, FireCall will infer all the type for you.

Whatever object literal the function return and(empty object = nothing to log) get logged on the console, except the `logType` props.

`logType` props is an optional prop that set the type of your log, by default it is `error`.

## Custom Error Message

Here is how you customize error messages:

```ts
const someFunc = onCall(
	someSchema,
	{
		route: 'public', // route is not optional, you can use either 'public' or 'private' value
		config: {
			changeBuiltInErrorCodeAndMessage: {
				unauthenticated: {
					code: 'someCode' // default: unauthenticated
					message: 'someMessage' // default: Please Login First
				},
				unknown: {
					code: 'someCode' // default: unknown
					message: 'someMessage' // default: unknown
				},
				resZodError: {
					code: 'someCode' // default: invalid-argument
					message: 'someMessage' // default: invalid-argument
				},
				reqZodError: {
					code: 'someCode' // default: internal
					message: 'someMessage' // default: invalid response
				}
			},
		},
	},
	handler
)
```

Every prop of `changeBuiltInErrorCodeAndMessage` is optional.

If no values are supplied, it uses default codes and messages.

The `code` value is limited to [Firebase Functions Error Code](https://firebase.google.com/docs/reference/node/firebase.functions#functionserrorcode) except 'ok'.

## Related Projects

1. [FirelordJS](https://github.com/tylim88/FireCall) - Typescript wrapper for Firestore Web V9
2. [Firelord](https://github.com/tylim88/Firelord) - Typescript wrapper for Firestore Admin
3. [Firelordrn](https://github.com/tylim88/firelordrn) - Typescript wrapper for Firestore React Native
4. [FireLaw](https://github.com/tylim88/firelaw) - Write Firestore security rule with Typescript, utilizing Firelord type engine.
