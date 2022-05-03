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

## Why You Need This? What Problem FireCall Trying To Solve?

When coding a callable function (or any endpoint in general), we need to deal with 5 basic errors

1. Unauthenticated error (only for protected route)
2. invalid request data error
3. invalid response data error (this is needed if we want to prevent unnecessary data send to front end)
4. developer defined error, whatever developer do and whatever error he want to throw
5. unknown error that happen for whatever reason (basically error that is not taken care by developer)

FireCall standardize the way of handling these errors for you.

There is also one common issue where developer often calling the wrong function name which lead to CORS error, basically front end and backend is not tally with each other.

So to solve this is we prepare a schema and share it to both front end and back end, by doing this not only we make sure that the function name is correct, but also we make sure that the data type is correct.

It is kind of like how Graphql works, but simpler and we all know how convoluted Graphql is.

Next is how we return error to front end: error handling is chaotic, error handling is hard, error handling make you go nut.

Some developer return error as 200 response and attach his own error code and message as data, and imagine every developer return his unique format of error, this is not fun.

With FireCall, no more "you return your error, I return my error, he return his error", everybody simply return a god damn standard HTTPS error.

Long thing short, FireCall make sure that there is only one way to do stuff.

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

if the response is not ok, handler must return object with `code` and `message` properties, and an optional `err` property, where  
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

If everything in `someOtherFile` is FireCall function, you can write something like this

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

By default, FireCall do not log the necessary information upon error. Pass a function to config.onErrorLogging.

Do this if you want to log:

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

`reqData`: the request data  
`context`: Firebase function context callable  
`reqZodError`: may exist, the error that occurs when trying to parse the request data  
`resZodError`: may exist, the error that occurs when trying to parse the response data  
`err`: may exist, it is the **user defined error** you return to the handler(the response). Its type is unknown until there is user defined error in the response, which mean you don't need to type cast, FireCall will infer all the type for you.

Note: Logging doesn't include saving it to a file or somewhere, it only logs it to the Firebase functions console. If you want to save the errors, then do it within function form.

Whatever the function return, it will get logged on the console.

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

## Change Built In Error Message

Here is how you change the built in error message:

```ts
const someFunc = onCall(
	someSchema,
	{
		route: 'public', // route is not optional, you can use either 'public' or 'private' value
		config: {
			changeBuiltInErrorCodeAndMessage: {
				unauthenticated: {
					code: 'someCode' // default unauthenticated
					message: 'someMessage' // default Please Login First
				},
				unknown: {
					code: 'someCode' // default unknown
					message: 'someMessage' // default unknown
				},
				resZodError: {
					code: 'someCode' // default invalid-argument
					message: 'someMessage' // default invalid-argument
				},
				reqZodError: {
					code: 'someCode' // default internal
					message: 'someMessage' // default invalid response
				}
			},
		},
	},
	handler
)
```

Every prop of `changeBuiltInErrorCodeAndMessage` is optional, if no values are supplied, it uses default codes and messages.

The `code` value is limited to [Firebase Functions Error Code](https://firebase.google.com/docs/reference/node/firebase.functions#functionserrorcode) except 'ok'.
