import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const UserSchema = new mongoose.Schema({
	firstName: {
		type: String,
		required: true,
	},
	lastName: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	handle: {
		type: String,
	},
	bio: {
		type: String,
	},
	password: {
		type: String,
		required: true,
	},
	avatar: {
		type: String,
		default: 'https://image.flaticon.com/icons/png/512/5173/5173555.png',
	},
   backgroundImg: {
      type: String,
   },
	fullTime: {
		type: Boolean,
		default: true,
	},
	position: {
		type: String,
	},
	company: {
		type: String,
	},
	skills: [
		{
			type: String,
		},
	],
})

UserSchema.pre('save', async function (next) {
	const newUser = this
	const plainPw = newUser.password

	if (newUser.isModified('password')) {
		newUser.password = await bcrypt.hash(plainPw, 10)
	}
	next()
})

UserSchema.methods.toJSON = function () {
	const user = this
	const userObject = user.toObject()
	delete userObject.password
	delete userObject.__v
	return userObject
}

UserSchema.statics.checkCredentials = async function (email, plainPw) {
	const user = await this.findOne({ email })
	console.log('checking credentials...')
	if (user) {
		const hashedPw = user.password
		const isMatch = await bcrypt.compare(plainPw, hashedPw)

		if (isMatch) {
			return user
		} else {
			return null
		}
	} else {
		return null
	}
}

export default mongoose.model('User', UserSchema)
