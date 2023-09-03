import createError from 'http-errors'
import UserModel from '../models/user/index.js'
import { verifyToken } from './tools.js'

export const JWTAuthMiddleware = async (req, res, next) => {
	let token

   // checking both in headers and cookies
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1]
	} else if (req.headers.cookie) {
		const cookieArray = req.headers.cookie.split('; ')
		const accessTokenCookie = cookieArray.find((cookie) =>
			cookie.startsWith('accessToken=')
		)
		if (accessTokenCookie) {
			token = accessTokenCookie.split('=')[1]
		}
	} else {
		next(createError(401, 'Please provide token!'))
		return
	}

	try {
		const content = await verifyToken(token)
		const user = await UserModel.findById(content._id)

		if (user) {
			req.user = user
			next()
		} else {
			next(createError(401, 'User not found!'))
		}
	} catch (error) {
		next(createError(401, 'Token not valid!'))
	}
}
