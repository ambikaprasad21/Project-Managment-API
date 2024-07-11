const catchAsync = require('../utils/catchAsync');
const Attachment = require('./../models/attachmentModel');

exports.attachMedia = (model) => {
  return catchAsync(async (req, res, next) => {
    console.log(req.body);
    const newAttachment = await Attachment.create({
      video: req.body.videofilename,
      images: req.body.images,
      pdfs: req.body.pdfs,
    });

    console.log(newAttachment);

    const newDoc = await model.findById(req.body.id);
    newDoc.attachments = newAttachment._id;
    await newDoc.save({ validateBeforeSave: false });
    //   req.body.newAttachmentId = newAttachment._id;

    res.status(200).json({
      statsu: 'success',
      data: newDoc,
    });
  });
};
