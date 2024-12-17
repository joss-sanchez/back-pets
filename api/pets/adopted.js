const AWS = require('aws-sdk');
const { getResponseHeaders, getFoundationId } = require('/opt/nodejs/headers');

AWS.config.update({region: 'us-east-1'});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();
const tableName = process.env.ALEGRA_PETS_TABLE;
const topic = process.env.SNS_TOPIC_ARN;

/**
 *
 * @param {*} event
 * @returns
 * Route: GET /pet/p/{petId}/adopted
 */
exports.handler = async (event) => {
  try {
    const foundationId = getFoundationId(event.headers);
    console.log("🚀 ~ exports.handler= ~ foundationId:", foundationId)
    const petId = parseInt(event.pathParameters.petId);

    const paramsFind = {
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

    const dataPet = await dynamoDb.query(paramsFind).promise();

    const item = dataPet.Items[0];
    item.status = 'happy';

    const data = await dynamoDb.put({
      TableName: tableName,
      Item: item,
      ConditionExpression: '#p = :p AND #f = :f',
      ExpressionAttributeNames: {
        '#p': 'petId',
        '#f': 'foundationId'
      },
      ExpressionAttributeValues: {
        ':p' : petId,
        ':f': foundationId
      }
    }).promise();

    const params = {
      Message: `La mascota ${item.name} fue adoptada`,
      TopicArn: topic
    };

    await sns.publish(params).promise();
    console.log('Mensaje publicado en SNS');

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