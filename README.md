<!-- markdownlint-disable MD010 -->
<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD041 -->

<div align="center">
		<img src="https://raw.githubusercontent.com/tylim88/Firelord/main/img/ozai.png" width="200px"/>
		<h1>FireCall 烈火唤(Beta)</h1>
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
</div>
<br/>

🔥 Helper Function to write easier and safer Firebase onCall function

FireCall standardizes how functions should handle:

- Unauthorized Authentication Error
- Unknown Error
- Invalid Request Data Error (ZodError)
- Invalid Response Data Error (ZodError)
- Validate Request Data With Zod
- Validate Response Data With Zod
- error logging (only log the error, does not save the error into a file)

Ensuring:

- always use standard HTTPS Error
- end point data type safety for both ends.(If you use with Firecaller)
- same function name for both ends. (If you use with Firecaller)

## Related Projects

1. [FirelordJS](https://github.com/tylim88/Firelordjs) - Typescript wrapper for Firestore Web V9
2. [Firelord](https://github.com/tylim88/Firelord) - Typescript wrapper for Firestore Admin
3. [Firelordrn](https://github.com/tylim88/firelordrn) - Typescript wrapper for Firestore React Native
4. [FireLaw](https://github.com/tylim88/firelaw) - Write Firestore security rule with Typescript, utilizing Firelord type engine.

FirelordJS is completed, the rest are still under development.

## Installation

```bash
npm install firecall zod firebase-functions
```

and of course you need `Typescript`.

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
	res: z.string(), // userId
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
`code`: 'ok'  
`data`: value that has same type as type you define in schema.res

if the response is not ok, handler must return object with `code`, `message` and `err` property, where  
`code`: [Firebase Functions Error Code](https://firebase.google.com/docs/reference/node/firebase.functions#functionserrorcode) except 'ok'  
`message`: string  
`err`: optional, **user defined error**, put anything you want here, normally the error object or just skip it

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

if everything in `someOtherFile` is FireCall function, you can write something like this

```ts
import * as allFunc from './someOtherFile'
import { exp } from 'firecall'

exp(allFunc).forEach(func => {
	const { name, onCall } = func
	exports[name] = onCall
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

## Error Logging Options

By default, FireCall log the necessary information upon error, this is what will get logged:

`reqData`: the request data  
`context`: Firebase function context callable  
`reqZodError`: may exist, the error that occurs when trying to parse the request data  
`resZodError`: may exist, the error that occurs when trying to parse the response data  
`err`: may exist, it is the **user defined error** you return to the handler(the response). Its type is unknown until there is user defined error in the response, which mean you don't need to type cast, FireCall will infer all the type for you.

Note: Logging doesn't include saving it to a file or somewhere, it only logs it to the Firebase functions console. If you want to save the errors, then do it within function form.

Normal form:

```ts
import { onCall } from 'firecall'

const someFunc = onCall(
	someSchema,
	{
		route: 'public', // route is not optional, you can use either 'public' or 'private' value
		config: {
			onErrorLogging: false, // will not log anything when error occurs
			onErrorLogging: true, // will log everything when error occurs
			onErrorLogging: undefined, // will log anything when error occurs
		},
	},
	handler
)
```

`onErrorLogging`: optional, `boolean | undefined`

Control how you log your error, `false` will not log anything, `true` or `undefined` will log everything.

Function form:

```ts
const someFunc = onCall(
	someSchema,
	{
		route: 'public', // route is not optional, you can use either 'public' or 'private' value
		config: {
			onErrorLogging: ({ context, reqData, reqZodError, resZodError, err }) => {
				// do something here, eg save to file

				return X // log X on the console
			},
		},
	},
	handler
)
```

`onErrorLogging`: optional, `({ reqData, context, reqZodError?, resZodError?, err? })=>any`

If you need a finer control, pass a function to it, the function receive an object that contains all the information you need to log.

Whatever the function return, it will get logged on console.

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
