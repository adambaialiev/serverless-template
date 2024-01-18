export const buildFileUrlForCourseProject = (key: string) =>
	`https://${process.env.learning_platform_bucket}.s3.amazonaws.com/${key}`;

export const buildFileUrlForbooksGPTProject = (key: string) =>
	`https://${process.env.booksgpt_bucket}.s3.amazonaws.com/${key}`;
