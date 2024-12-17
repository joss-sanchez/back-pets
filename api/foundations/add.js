const AWS = require('aws-sdk');
const uuidv4 = require('uuid')
const { getResponseHeaders, getUserId, getUserName } = require('/opt/nodejs/headers');

AWS.config.update({region: 'us-east-1'});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const tableName = process.env.ALEGRA_FOUNDATIONS_TABLE;
const bucketName = process.env.BODY_BUCKET_NAME;

/**
 *
 * @param {*} event
 * @returns
 * Route: POST /foundation
 */
exports.handler = async (event) => {
  try {
    const item = JSON.parse(event.body).Item;
    item.userId = getUserId(event.headers);
    item.userName = getUserName(event.headers);
    item.foundationId = `${item.userId}:${uuidv4.v4()}`;
    item.timestamp = Date.now();
    item.expires = Date.now() + 90 * 24 * 60 * 60 * 1000;

    await dynamoDb.put({
      TableName: tableName,
      Item: item,
    }).promise();

    const s3Key = `items/foundations/post/${item.foundationId}.json`;
    await s3.putObject({
      Bucket: bucketName,
      Key: s3Key,
      Body: JSON.stringify(item),
      ContentType: 'application/json',
    }).promise();

    return {
      statusCode: 201,
      headers: getResponseHeaders(),
      body: JSON.stringify(item)
    };
  } catch (error) {
    console.log("🚀 ~ exports.handler= ~ error:", error)
    return {
      statusCode: error.statusCode ? error.statusCode : 500,
      headers: getResponseHeaders(),
      body: JSON.stringify({
        error: error.name ? error.name : 'Exception',
        message: error.message ? error.message : 'Unknown error'
      })
    };
  }
};
