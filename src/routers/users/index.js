import { Router } from 'express'
import createError from 'http-errors'
import { JWTAuthenticate } from '../../auth/tools.js'
import { JWTAuthMiddleware } from '../../auth/middleWares.js'
import UserModel from '../../models/user/index.js'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

const usersRouter = Router()

usersRouter.post('/login', async (req, res, next) => {
   try {
     const { email, password } = req.body;
     const user = await UserModel.checkCredentials(email, password);
 
     if (user) {
       const accessToken = await JWTAuthenticate(user);
       
       res.cookie('accessToken', accessToken, {
         httpOnly: true,
         // secure: process.env.NODE_ENV === 'production', // set to true if you are using https
         sameSite: 'strict',
         maxAge: 3600000
       });
 
       res.send({ userId: user._id });
     } else {
       next(createError(401));
     }
   } catch (error) {
     next(error);
   }
 });
 

usersRouter.post('/register', async (req, res, next) => {
	try {
		const newUser = new UserModel(req.body)
		const { _id } = await newUser.save()

		res.status(201).send(_id)
	} catch (error) {
		console.log(error)
		next(createError(500, 'An error occurred while saving new user'))
	}
})

usersRouter.get('/', async (req, res, next) => {
	try {
		const users = await UserModel.find()
		res.status(200).send(users)
	} catch (error) {
		next(createError(500, { message: error.message }))
	}
})

usersRouter.get('/me', JWTAuthMiddleware, async (req, res, next) => {
	try {
		const user = await UserModel.findById(req.user._id).populate([
			{
				path: 'course',
				populate: { path: 'subjects' },
			},
			'uni',
			'availableSubjects',
		])
		if (!user) next(createError(404, `ID ${req.params.id} was not found`))
		else res.status(200).send(user)
	} catch (error) {
		next(error)
	}
})

usersRouter.get('/:id', async (req, res, next) => {
	try {
		const user = await UserModel.findById(req.params.id).populate([
			'course',
			'uni',
			'availableSubjects',
			{
				path: 'comments',
				populate: { path: 'author' },
			},
		])
		if (!user) next(createError(404, `ID ${req.params.id} was not found`))
		else res.status(200).send(user)
	} catch (error) {
		next(error)
	}
})

// Update personal info
usersRouter.put('/info', JWTAuthMiddleware, async (req, res, next) => {
	const { firstname, lastname, email, handle, position, company } = req.body
	try {
		await UserModel.findByIdAndUpdate(
			req.user._id,
			{
				firstname,
				lastname,
				email,
				handle,
				position,
				company,
			},
			{
				runValidators: true,
				new: true,
			}
		)
		res.status(200).send('Personal info updated')
	} catch (error) {
		next(error)
	}
})

// Update skills
usersRouter.put('/skills', JWTAuthMiddleware, async (req, res, next) => {
	const { skills } = req.body
	try {
		await UserModel.findByIdAndUpdate(
			req.user._id,
			{ skills },
			{
				runValidators: true,
				new: true,
			}
		)
		res.status(200).send('Skills updated')
	} catch (error) {
		next(error)
	}
})

// Update bio
usersRouter.put('/bio', JWTAuthMiddleware, async (req, res, next) => {
	const { bio } = req.body
	try {
		await UserModel.findByIdAndUpdate(
			req.user._id,
			{ bio },
			{
				runValidators: true,
				new: true,
			}
		)
		res.status(200).send('Bio updated')
	} catch (error) {
		next(error)
	}
})

usersRouter.delete('/:id', async (req, res, next) => {
	try {
		const deleteUser = await UserModel.findByIdAndDelete(req.params.id)
		if (deleteUser) res.status(201).send('Profile deleted')
		else next(createError(400, 'Bad Request'))
	} catch (error) {
		next(error)
	}
})

// ------- cloudinary -------

const cloudinaryStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: 'UniHub',
	},
})

usersRouter.post(
	'/:id/imageupload',
	multer({ storage: cloudinaryStorage }).single('avatar'),
	async (req, res, next) => {
		try {
			const user = await UserModel.findByIdAndUpdate(
				req.params.id,
				{ avatar: req.file.path },
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
