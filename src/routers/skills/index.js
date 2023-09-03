import { Router } from 'express'
import fs from 'fs/promises'
import createError from 'http-errors'

const skillsRouter = Router()

skillsRouter.get('/', async (req, res) => {
	try {
		const { query } = req.query
		const data = JSON.parse(await fs.readFile('./data/skills.json', 'utf-8'))

		if (query) {
			const filteredSkills = data.skills.filter((skill) =>
				skill.toLowerCase().includes(query.toLowerCase())
			)
			res.status(201).send({ skills: filteredSkills })
		} else {
			res.status(201).send({ skills: data.skills })
		}
	} catch (error) {
		next(createError(500, 'An error occurred while saving new user'))
	}
})

export default skillsRouter
