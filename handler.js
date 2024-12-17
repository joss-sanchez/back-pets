const _ = require ('lodash');
const fs = require('fs');
const { getResponseHeaders } = require('/opt/nodejs/headers');

exports.hello = async (event) => {
  console.log("🚀 ~ exports.hello= ~ event:", event)
  const data = _.chunk(['a', 'b', 'c', 'd'], 2);
  console.log("🚀 ~ exports.hello= ~ data:", data)
  console.log(fs.readdirSync('/opt/nodejs/node_modules'));

  return {
    statusCode: 200,
    headers: getResponseHeaders(),
    body: JSON.stringify({
      message: 'Go Serverless v4.0! Your function executed successfully!',
      data
    })
  };
};
