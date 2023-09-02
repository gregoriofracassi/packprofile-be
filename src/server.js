import cors from 'cors'
import express from 'express'
import usersRouter from './routers/users/index.js'
import skillsRouter from './routers/skills/index.js'
import {
	badRequestErrorHandler,
	notFoundErrorHandler,
	forbiddenErrorHandler,
	catchAllErrorHandler,
	unauthorizedErrorHandler,
} from './errorHandlers.js'

const server = express()

const whitelist = [process.env.LOCAL_FE]

const corsOptions = {
	origin: function (origin, next) {
		if (!origin || whitelist.includes(origin)) {
			next(null, true)
		} else {
			next(new Error('Origin is not supported!'))
		}
	},
   credentials: true
}

server.use(cors(corsOptions))
server.use(express.json())

server.use('/users', usersRouter)
server.use('/skills', skillsRouter)

server.use(badRequestErrorHandler)
server.use(notFoundErrorHandler)
server.use(forbiddenErrorHandler)
server.use(unauthorizedErrorHandler)
server.use(catchAllErrorHandler)

export default server
