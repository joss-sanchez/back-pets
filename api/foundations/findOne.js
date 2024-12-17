const AWS = require('aws-sdk');
const _ = require ('lodash');

const { getResponseHeaders } = require('/opt/nodejs/headers');

AWS.config.update({region: 'us-east-1'});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.ALEGRA_FOUNDATIONS_TABLE;
/**
 *
 * @param {*} event
 * @returns
 * Route: GET /foundation/n/{foundationId}
 */
exports.handler = async (event) => {
  try {
    const foundationId = decodeURIComponent(event.pathParameters.foundationId);
    const params = {
      TableName: tableName,
      IndexName: 'foundationId-index',
      KeyConditionExpression: 'foundationId = :fid',
      ExpressionAttributeValues: {
        ':fid': foundationId
      },
      Limit: 1
    };

    const data = await dynamoDb.query(params).promise();
    if(!_.isEmpty(data.Items))
      return {
        statusCode: 200,
        headers: getResponseHeaders(),
        body: JSON.stringify(data.Items[0])
      };
    else
      return {
        statusCode: 404,
        headers: getResponseHeaders()
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
