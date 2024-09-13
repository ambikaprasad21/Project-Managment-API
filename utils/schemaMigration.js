const Project = require('./../models/projectModel'); // Your project model

exports.migrateProjectFiles = async () => {
  const projects = await Project.find();

  for (let project of projects) {
    // Update images
    if (Array.isArray(project.images)) {
      project.images = project.images.map((filePath) => ({
        location: filePath,
        name: filePath.split('/').pop(), // Extract the file name from the path
      }));
    }

    // Update pdfs
    if (Array.isArray(project.pdfs)) {
      project.pdfs = project.pdfs.map((filePath) => ({
        location: filePath,
        name: filePath.split('/').pop(),
      }));
    }

    // Save the updated project
    await project.save();
  }
  console.log('Migration complete.');
};
