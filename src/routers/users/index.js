import { Router } from 'express'
import createError from 'http-errors'
import { JWTAuthenticate } from '../../auth/tools.js'
import { JWTAuthMiddleware } from '../../auth/middleWares.js'
import UserModel from '../../models/user/index.js'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { formatHandle, generateHandle } from '../../helpers/user.js'

const usersRouter = Router()

usersRouter.post('/login', async (req, res, next) => {
	try {
		const { email, password } = req.body
		const user = await UserModel.checkCredentials(email, password)

		if (user) {
			const accessToken = await JWTAuthenticate(user)
			res.cookie('accessToken', accessToken, {
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 3600000,
			})

			res.send({ user })
		} else {
			next(createError(401))
		}
	} catch (error) {
		next(error)
	}
})

usersRouter.post('/logout', async (req, res, next) => {
	try {
		res.clearCookie('accessToken', {
			httpOnly: true,
			sameSite: 'strict',
		})

		res.status(200).send({ message: 'Successfully logged out' })
	} catch (error) {
		next(error)
	}
})

usersRouter.post('/register', async (req, res, next) => {
	try {
		const newUser = new UserModel(req.body)
		if (!req.body.handle) {
			newUser.handle = generateHandle(newUser)
		}
		const { _id } = await newUser.save()

		res.status(201).send(_id)
	} catch (error) {
		next(createError(500, 'An error occurred while saving new user'))
	}
})

usersRouter.get('/', JWTAuthMiddleware, async (req, res, next) => {
	try {
		const count = parseInt(req.query.count) || 10
		const randomUsers = await UserModel.aggregate([
			{ $sample: { size: count } },
		])
		res.status(200).json(randomUsers)
	} catch (error) {
		next(createError(500, { message: error.message }))
	}
})

usersRouter.get('/me', JWTAuthMiddleware, async (req, res, next) => {
	try {
		const user = await UserModel.findById(req.user._id)
		if (!user) next(createError(404, `ID ${req.params.id} was not found`))
		else res.status(200).send(user)
	} catch (error) {
		next(createError(500, { message: error.message }))
	}
})

usersRouter.get('/:id', JWTAuthMiddleware, async (req, res, next) => {
	try {
		const user = await UserModel.findById(req.params.id)
		if (!user) next(createError(404, `ID ${req.params.id} was not found`))
		else res.status(200).send(user)
	} catch (error) {
		next(createError(500, { message: error.message }))
	}
})

// Update personal info
usersRouter.put('/info/:id', JWTAuthMiddleware, async (req, res, next) => {
	const { firstName, lastName, email, handle, position, company, fullTime } =
		req.body
	try {
		await UserModel.findByIdAndUpdate(
			req.params.id,
			{
				firstName,
				lastName,
				email,
				handle: formatHandle(handle),
				position,
				company,
				fullTime,
			},
			{
				runValidators: true,
				new: true,
			}
		)
		res.status(200).send({ message: 'Info updated' })
	} catch (error) {
		next(createError(500, { message: error.message }))
	}
})

// Update skills
usersRouter.put('/skills/:id', JWTAuthMiddleware, async (req, res, next) => {
	const { skills } = req.body
	try {
		await UserModel.findByIdAndUpdate(
			req.params.id,
			{ skills },
			{
				runValidators: true,
				new: true,
			}
		)
		res.status(200).send({ message: 'Skills updated' })
	} catch (error) {
		next(createError(500, { message: error.message }))
	}
})

// Update bio
usersRouter.put('/bio/:id', JWTAuthMiddleware, async (req, res, next) => {
	const { bio } = req.body
	try {
		await UserModel.findByIdAndUpdate(
			req.params.id,
			{ bio },
			{
				runValidators: true,
				new: true,
			}
		)
		res.status(200).send({ message: 'Bio updated' })
	} catch (error) {
		next(createError(500, { message: error.message }))
	}
})

// ------- cloudinary -------

const cloudinaryStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: 'UniHub',
	},
})

usersRouter.put(
	'/imageupload/:id',
	JWTAuthMiddleware,
	multer({ storage: cloudinaryStorage }).single('avatar'),
	async (req, res, next) => {
		try {
			const type =
				req.query.type === 'updateAvatar' ? 'avatar' : 'backgroundImg'
			const user = await UserModel.findByIdAndUpdate(
				req.params.id,
				{ [type]: req.file.path },
				{ runValidators: true, new: true }
			)
			if (user) {
				res.send(user)
			} else {
				next(
					createError(404, { message: `user ${req.params.id} not found` })
				)
			}
		} catch (error) {
			next(createError(500, 'An error occurred while uploading user avatar'))
		}
	}
)

export default usersRouter
