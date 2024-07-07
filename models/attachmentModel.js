const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    video: String,
    images: [String],
    pdfs: [String],
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

const Attachment = mongoose.model('Attachment', attachmentSchema);
module.exports = Attachment;
