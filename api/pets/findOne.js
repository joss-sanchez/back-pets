const AWS = require('aws-sdk');
const { getResponseHeaders, getFoundationId } = require('/opt/nodejs/headers');

AWS.config.update({region: 'us-east-1'});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.ALEGRA_PETS_TABLE;

/**
 *
 * @param {*} event
 * @returns
 * Route: GET /pet/p/{petId}
 */
exports.handler = async (event) => {
  try {
    const foundationId = getFoundationId(event.headers);
    const petId = parseInt(event.pathParameters.petId);
    const params = {
      TableName: tableName,
      KeyConditionExpression: '#p = :p AND #f = :f',
      ExpressionAttributeNames:{
        '#p': 'petId',
        '#f': 'foundationId'
      },
      ExpressionAttributeValues: {
        ':p' : petId,
        ':f': foundationId
      },
      Limit: 1
    };

    const data = await dynamoDb.query(params).promise();

    return {
      statusCode: 200,
      headers: getResponseHeaders(),
      body: JSON.stringify(data.Items[0])
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