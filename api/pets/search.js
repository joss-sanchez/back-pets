const AWS = require('aws-sdk');
const { getResponseHeaders, getFoundationId } = require('/opt/nodejs/headers');

AWS.config.update({region: 'us-east-1'});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.ALEGRA_PETS_TABLE;

/**
 *
 * @param {*} event
 * @returns
 * Route: GET /pets/search
 */
exports.handler = async (event) => {
  try {
    const query =  event.queryStringParameters;
    const foundationId = getFoundationId(event.headers);
    const name = query && query.name ? query.name : null;
    const type = query && query.type ? query.type : null;
    const race = query && query.race ? query.race : null;

    const params = {
      TableName: tableName,
      KeyConditionExpression: '#f = :f', // Necesario porque `foundationId` es la clave HASH
      FilterExpression: '',
      ExpressionAttributeNames: {
        '#f': 'foundationId',
      },
      ExpressionAttributeValues: {
        ':f': foundationId,
      },
    };
    if (name) {
      params.FilterExpression += '#n = :n ';
      params.ExpressionAttributeNames['#n'] = 'name';
      params.ExpressionAttributeValues[':n'] = name;
    }
    if (type) {
      params.FilterExpression += `${params.FilterExpression ? 'AND ' : ''}#t = :t `;
      params.ExpressionAttributeNames['#t'] = 'type';
      params.ExpressionAttributeValues[':t'] = type;
    }
    if (race) {
      params.FilterExpression += `${params.FilterExpression ? 'AND ' : ''}#r = :r `;
      params.ExpressionAttributeNames['#r'] = 'race';
      params.ExpressionAttributeValues[':r'] = race;
    }

    const data = await dynamoDb.query(params).promise();

    if(data.Count === 0){
      return {
        statusCode: 404,
        headers: getResponseHeaders()
      };
    }

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