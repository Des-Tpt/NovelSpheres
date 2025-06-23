import { Schema, Document, models, model } from 'mongoose';

export interface IGenre extends Document{
    _id: Schema.Types.ObjectId,
    name: string,
    description: string
}

const GenreSchema = new Schema<IGenre>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true , unique: true},
    description: {type: String, required: true}
})

export const Genre = models.Genre || model<IGenre>('Genre', GenreSchema, 'Genre');