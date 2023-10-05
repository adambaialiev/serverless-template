const BucketName = process.env.learning_platform_bucket as string;

export const buildFileUrl = (key: string) =>
	`https://${BucketName}.s3.amazonaws.com/${key}`;

export { BucketName };
