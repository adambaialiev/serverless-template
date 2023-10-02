import { APIGatewayProxyHandler } from "aws-lambda";
import { sendResponse } from "@/utils/makeResponse";
import { S3 } from "aws-sdk";
import KSUID from "ksuid";

export interface GetUploadUrlParams {
  extension: string;
  contentType: string;
}

const bucketName = process.env.bucket;

const URL_EXPIRATION_SECONDS = 300;

export const main: APIGatewayProxyHandler = async (event) => {
  try {
    const { extension, contentType } = JSON.parse(
      event.body
    ) as GetUploadUrlParams;

    const client = new S3();
    const Key = `${KSUID.randomSync().string}.${extension}`;

    const params = {
      Bucket: bucketName,
      Key,
      Expires: URL_EXPIRATION_SECONDS,
      ContentType: contentType,
      ACL: "public-read",
      ContentDisposition: `attachment; filename="${Key}"`,
    };
    const uploadUrl = await client.getSignedUrlPromise("putObject", params);

    return sendResponse(201, { uploadUrl, key: Key });
  } catch (error: unknown) {
    console.log(error);
    if (error instanceof Error) {
      return sendResponse(500, error.message);
    }
  }
};
