import User from '../models/User'
import File from '../models/File'
import Appointment from '../models/Appointment'

import StoreAppointmentService from '../services/Appointment/StoreAppointmentService'
import CancelAppointmentService from '../services/Appointment/CancelAppointmentService'

import Cache from '../../lib/Cache'

class AppointmentController {
    async index(req, res) {
        const { page = 1 } = req.query

        const cacheKey = `user:${req.userId}:appointment:${page}`
        const cached = await Cache.get(cacheKey)

        if (cached) {
            return res.json(cached)
        }

        const appointments = await Appointment.findAll({
            where: { user_id: req.userId, canceled_at: null },
            order: ['date'],
            attributes: ['id', 'date', 'past', 'cancelable'],
            limit: 20,
            offset: (page - 1) * 20,
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: File,
                            as: 'avatar',
                            attributes: ['id', 'path', 'url']
                        }
                    ]
                }
            ]
        })

        Cache.set(cacheKey, appointments)

        return res.json(appointments)
    }

    async store(req, res) {
        const { provider_id, date } = req.body

        try {
            const appointment = await StoreAppointmentService.run({
                provider_id,
                user_id: req.userId,
                date
            })

            return res.json(appointment)
        } catch (error) {
            return res.status(401).json({ error: error.message })
        }
    }

    async delete(req, res) {
        try {
            const appointment = CancelAppointmentService.run({
                provider_id: req.params.id,
                user_id: req.userId
            })

            return res.json(appointment)
        } catch (error) {
            return res.status(401).json({ error: error.message })
        }
    }
}

export default new AppointmentController()