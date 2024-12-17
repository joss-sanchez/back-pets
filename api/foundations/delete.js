const AWS = require('aws-sdk');
const { getResponseHeaders, getFoundationId } = require('/opt/nodejs/headers');

AWS.config.update({region: 'us-east-1'});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.ALEGRA_FOUNDATIONS_TABLE;
/**
 *
 * @param {*} event
 * @returns
 * Route: DELETE /foundation/t/{timestamp}
 */
exports.handler = async (event) => {
  try {
    const timestamp = parseInt(event.pathParameters.timestamp);
    const params = {
      TableName: tableName,
      Key: {
        timestamp,
        foundationId: getFoundationId(event.headers)
      }
    };

    await dynamoDb.delete(params).promise();
    return {
      statusCode: 204,
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
