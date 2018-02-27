/*
csrc
*/
var fetch = require("node-fetch");
var cheerio = require('cheerio')
var AWS = require("aws-sdk");
var tableName = "GOV_RECORD";
AWS.config.update({
  region: "us-east-1"
});
var docClient = new AWS.DynamoDB.DocumentClient();

var config = [
  {
    "selector":"#con_1_1",
    "categoryName":"证监会要闻"
  },{
    "selector":"div.in_new.r_10>.in_list_2>ul.bulletin",
    "categoryName":"证监会令"
  },{
    "selector":"div.in_new>div.in_list.bulletin>ul",
    "categoryName":"证监会公告"
  }
]
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
  console.log(formatDate(new Date(),'yyyy-MM-dd hh:mm:ss') + "开始记录证监会的相关新闻");
  fetch("http://www.csrc.gov.cn/pub/newsite/")
  .then(function(response){
    console.log(formatDate(new Date(),'yyyy-MM-dd hh:mm:ss') + "开始抓取数据");
    return response.text();
  }).then(function(text){
    console.log(formatDate(new Date(),'yyyy-MM-dd hh:mm:ss') + "抓取数据成功");
    var $ = cheerio.load(text);

    $(config).each(function(_i,_e){
      var $temp = $(_e.selector);
      $("a", $temp).each(function(i, e){
        var $a = $(e);
        var link = "http://www.csrc.gov.cn/pub/newsite/"+$a.attr("href");
        var title = $a.attr("title");
        var categoryName = _e.categoryName;

          var date = $a.next().text()
          if(date) {
            date = formatDate(new Date(),'yyyy-')+ date;
          } else {
            date = formatDate(new Date());
          }
        if(title) {
          var queryParams = {
            TableName:tableName,
            Key:{
                "title": title,
                "link": link
            }
          }
          docClient.get(queryParams, function(err, data){
            if(err){
              console.error("Unable to query item. Error JSON:", JSON.stringify(err, null, 2));
            } else if(!data.Item) {
              var params = {
                  TableName:tableName,
                  Item:{
                      "title": title,
                      "category": categoryName,
                      "department": "证监会",
                      "link":link,
                      "date": date,
                      "async_google_calendar": false
                  }
              };
              docClient.put(params,function(err,data){
                if (err) {
                  console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                  console.log(formatDate(new Date(),'yyyy-MM-dd hh:mm:ss') + "保存数据成功:"+JSON.stringify(params.Item));
                }
              })
            } else {
              console.log(formatDate(new Date(),'yyyy-MM-dd hh:mm:ss') + "记录已存在:"+JSON.stringify(queryParams.Key));
            }
          })
        }
      })
    })
  })
}
