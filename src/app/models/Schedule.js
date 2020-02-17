import Mongoose from 'mongoose'

const ScheduleSchema = new Mongoose.Schema(
    {
        hour: {
            type: String,
        },
    }
)

export default Mongoose.model('Schedule', ScheduleSchema)