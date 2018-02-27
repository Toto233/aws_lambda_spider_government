var fetch = require("node-fetch");
var AWS = require("aws-sdk");
var querystring = require('querystring');
var tableName = "GOV_RECORD";
AWS.config.update({
  region: "us-east-1"
});
var docClient = new AWS.DynamoDB.DocumentClient();

module.exports = function(){
  var queryParams = {
      TableName : tableName,
      FilterExpression: "async_google_calendar = :async",
      ExpressionAttributeValues:{
          ":async": false
      },
  };
  return docClient.scan(queryParams).promise()
    .then(function(data){
      data.Items.forEach(function(item){
        console.log("找到了记录未同步记录："+JSON.stringify(item));
        var params = {"value1":item.title, "value2": item.link, "value3": item.department};
        fetch("https://maker.ifttt.com/trigger/government/with/key/b7UWX91Bi1QCmbb-1uQzhY", {method:"POST", body: querystring.stringify(params),headers: { 'Content-Type': 'application/x-www-form-urlencoded' }})
        // fetch("https://requestb.in/r0vhv0r0", {method:"POST", body: querystring.stringify(params),headers: { 'Content-Type': 'application/x-www-form-urlencoded' }})
        .then(function(response){
          console.log("调用ifttt接口成功")
          var params = {
              TableName:tableName,
              Key:{
                  "link": item.link,
                  "title": item.title
              },
              UpdateExpression: "set async_google_calendar = :async",
              ExpressionAttributeValues:{
                  ":async":true
              },
              ReturnValues:"UPDATED_NEW"
          };
          docClient.update(params).promise().then(function(data){
            console.log("UpdateItem succeeded:", JSON.stringify(data));
          })
        })
      })
    })
}
