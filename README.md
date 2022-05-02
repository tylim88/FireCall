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
			<a href="https://github.com/tylim88/firecall/actions" target="_blank">
				<img
					src="https://github.com/tylim88/firecall/workflows/Main/badge.svg"
					alt="github action"
				/>
			</a>
			&nbsp;
			<a href="https://codecov.io/gh/tylim88/firecall" target="_blank">
				<img
					src="https://codecov.io/gh/tylim88/firecall/branch/main/graph/badge.svg"
					alt="code coverage"
				/>
			</a>
			&nbsp;
			<a href="https://github.com/tylim88/firecall/issues" target="_blank">
				<img
					alt="GitHub issues"
					src="https://img.shields.io/github/issues-raw/tylim88/firecall"
				></img>
			</a>
			&nbsp;
			<a href="https://snyk.io/test/github/tylim88/firecall" target="_blank">
				<img
					src="https://snyk.io/test/github/tylim88/firecall/badge.svg"
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
			<a href="https://lgtm.com/projects/g/tylim88/FireCall/context:javascript">
				<img
					target="_blank"
					alt="Language grade: JavaScript" 
					src="https://img.shields.io/lgtm/grade/javascript/g/tylim88/FireCall.svg?logo=lgtm&logoWidth=18"/>
			</a>
</div>

🔥 Helper Function to write easier and safer Firebase onCall function

FireCall standardizes how functions should handle:

- Unauthorized Authentication Error
- Unknown Error
- Invalid Request Data Error
- Invalid Response Data Error\*
- Validate Request Data With Zod
- Validate Response Data With Zod\*

With FireCall and FireCaller, we can ensure:

- standard HTTPS Error
- end point data type safety

It may seem bizarre why we need to validate response data, but it is not wrong to make sure the data shape is correct in run time.

## Installation

```bash
npm install firecall zod firebase-functions
```

and of course you need `Typescript`.

## Create Schema With Zod

First, you need to create schema with `zod`, you can share this file to front end.

Note: You should use [FireCaller](https://github.com/tylim88/FireCaller) in front end.

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
import { updateUserSchema } from './someFiles'
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
		} catch (e) {
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
	updateUserSchema,
	{ route: 'public' }, // 'public' for unprotected route
	// handler
	async data => {
		const uid = data // request data is what you define in schema.req

		try {
			const { name, age, secret } = await getUserFromDatabase({
				uid,
			})
			return { code: 'ok', data: { name, age } } // response data is what you define in schema.res
		} catch (e) {
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
`err`: optional, put anything you want here, normally the error object or just skip it

## Export Functions

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
		route: 'public',
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
