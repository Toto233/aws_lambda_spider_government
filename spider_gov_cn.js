var fetch = require("node-fetch");
var cheerio = require('cheerio')
var AWS = require("aws-sdk");
var tableName = "GOV_RECORD";
AWS.config.update({
  region: "us-east-1"
});
var docClient = new AWS.DynamoDB.DocumentClient();

function formatDate(date,fmt) { //author: meizz
  if(!fmt){
    fmt = 'yyyy-MM-dd';
  }
  var o = {
      "M+": date.getMonth() + 1, //月份
      "d+": date.getDate(), //日
      "h+": date.getHours(), //小时
      "m+": date.getMinutes(), //分
      "s+": date.getSeconds(), //秒
      "q+": Math.floor((date.getMonth() + 3) / 3), //季度
      "S": date.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

module.exports = function(){
  console.log(formatDate(new Date(),'yyyy-MM-dd hh:mm:ss') + "开始记录gov.cn的相关数据");
  fetch("http://www.gov.cn/pushinfo/v150203/pushinfo.json")
  .then(function(response){
    console.log(formatDate(new Date(),'yyyy-MM-dd hh:mm:ss') + "抓取gov.cn数据完成");
    return response.json();
  }).then(function(news){
    for(var i in news) {
      if(i <= 10){
        var item = news[i];
        item.department=item.author;
        item.date=item.pubDate;
        item.category=item.author;
        saveData(item);
      }
    }
  });
}

function saveData(item){
  var queryParams = {
    TableName:tableName,
    Key:{
        "title": item.title,
        "link": item.link
    }
  }
  return docClient.get(queryParams).promise()
        .then(function(data){
          if(!data.Item){
            var params = {
                TableName:tableName,
                Item:{
                    "title": item.title,
                    "category": item.category,
                    "department": item.department,
                    "link":item.link,
                    "date": formatDate(new Date()),
                    "async_google_calendar":false
                }
            };
            return docClient.put(params).promise();
          } else {
            // TODO return what?
          }
        }).then(function(data){
          if(data) {
            console.log(formatDate(new Date(),'yyyy-MM-dd hh:mm:ss') + "保存数据成功:"+JSON.stringify(item));
          }
        });
}
