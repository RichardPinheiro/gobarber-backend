import { startOfHour, parseISO, isBefore, format } from 'date-fns'

import User from '../../models/User'
import Appointment from '../../models/Appointment'
import Notification from '../../models/Notification'

import Cache from '../../../lib/Cache'

class StoreAppointmentService {
    async run({ provider_id, user_id, date }) {
        if (user_id == provider_id) {
            throw new Error('You can not create appointments with your self')
        }

        const isProvider = await User.findOne({
            where: { id: provider_id, provider: true }
        })

        if (!isProvider) {
            throw new Error('You can only create appointments with providers')
        }

        const hourStart = startOfHour(parseISO(date))

        if (isBefore(hourStart, new Date())) {
            throw new Error('Past dates is not permited')
        }

        const chackAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart
            }
        })

        if (chackAvailability) {
            throw new Error('Appointment date is not available')
        }

        const appointment = await Appointment.create({
            user_id,
            provider_id,
            date
        })

        const user = await User.findByPk(user_id)

        const formattedDate = format(
            hourStart,
            "MMMM dd 'at' H:mma"
        )

        await Notification.create({
            content: `new schedule by ${user.name} for ${formattedDate}`,
            user: provider_id
        })

        Cache.deleteByPrefix(`user:${user.id}:appointment`)

        return appointment
    }
}

export default new StoreAppointmentService()