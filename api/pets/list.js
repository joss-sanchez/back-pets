const AWS = require('aws-sdk');
const { getResponseHeaders, getUserId, getUserName, getFoundationId } = require('/opt/nodejs/headers');

AWS.config.update({region: 'us-east-1'});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.ALEGRA_PETS_TABLE;

/**
 *
 * @param {*} event
 * @returns
 * Route: GET /pets
 */
exports.handler = async (event) => {
  try {
    const query =  event.queryStringParameters;
    const foundationId = getFoundationId(event.headers);
    const limit = query && query.limit ? parseInt(query.limit) : 5;
    const params = {
      TableName: tableName,
      IndexName: 'foundationId-index',
      KeyConditionExpression: '#fid = :fid',
      ExpressionAttributeNames:{
        '#fid': 'foundationId'
      },
      ExpressionAttributeValues: {
        ':fid': foundationId
      },
      Limit: limit,
    };

    const startKey = query && query.start ? parseInt(query.start) : null;

    if(startKey){
      params.ExclusiveStartKey = {
        petId: startKey
      }
    }
    const data = await dynamoDb.query(params).promise();
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