const catchAsync = require('../utils/catchAsync');
const Attachment = require('./../models/attachmentModel');
const Project = require('./../models/projectModel');

exports.attachMedia = catchAsync(async (req, res, next) => {
  const newAttachment = await Attachment.create({
    video: req.body.videofilename,
    images: req.body.images,
    pdfs: req.body.pdfs,
  });

  const project = await Project.findById(req.body.newProjectId);
  project.attachments = newAttachment._id;
  await project.save({ validateBeforeSave: false });
  //   req.body.newAttachmentId = newAttachment._id;

  res.status(200).json({
    statsu: 'success',
    data: project,
  });
});
