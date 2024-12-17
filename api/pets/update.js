const AWS = require('aws-sdk');
const uuidv4 = require('uuid')
const { getResponseHeaders, getUserId, getUserName, getFoundationId } = require('/opt/nodejs/headers');

AWS.config.update({region: 'us-east-1'});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const tableName = process.env.ALEGRA_PETS_TABLE;
const bucketName = process.env.BODY_BUCKET_NAME;

/**
 *
 * @param {*} event
 * @returns
 * Route: PATCH /pet
 */
exports.handler = async (event) => {
  try {
    const item = JSON.parse(event.body).Item;
    item.userId = getUserId(event.headers);
    item.userName = getUserName(event.headers);
    item.expires = Date.now() + 90 * 24 * 60 * 60 * 1000;
    item.foundationId = getFoundationId(event.headers)

    if(!item.petId)
      return {
        statusCode: 402,
        headers: getResponseHeaders(),
        body: JSON.stringify('petId is required.')
      };

    const data = await dynamoDb.put({
      TableName: tableName,
      Item: item,
      ConditionExpression: '#p = :p AND #f = :f',
      ExpressionAttributeNames: {
        '#p': 'petId',
        '#f': 'foundationId'
      },
      ExpressionAttributeValues: {
        ':p' : item.petId,
        ':f': item.foundationId
      }
    }).promise();

    const s3Key = `items/pets/patch/${item.foundationId}.json`;
    await s3.putObject({
      Bucket: bucketName,
      Key: s3Key,
      Body: JSON.stringify(item),
      ContentType: 'application/json',
    }).promise();

    return {
      statusCode: 200,
      headers: getResponseHeaders(),
      body: JSON.stringify(data)
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