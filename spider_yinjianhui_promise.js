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
    "selector":"#rightDiv_0",
    "categoryName":"热点新闻"
  },{
    "selector":"#rightDiv_1",
    "categoryName":"国务院信息"
  },{
    "selector":".right2>div.right2_1",
    "index":"0",
    "categoryName":"领导讲话"
  },{
    "selector":".right2>div.right2_1",
    "index":"1",
    "categoryName":"要闻导读"
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
var ALL_TASK = [];
module.exports = function(){
  console.log(formatDate(new Date(),'yyyy-MM-dd hh:mm:ss') + "开始记录银监会的相关新闻");
  fetch("http://www.cbrc.gov.cn/index.html")
  .then(function(response){
    console.log(formatDate(new Date(),'yyyy-MM-dd hh:mm:ss') + "开始抓取数据");
    return response.text();
  }).then(function(text){
    console.log(formatDate(new Date(),'yyyy-MM-dd hh:mm:ss') + "抓取数据成功");
    var $ = cheerio.load(text);

    $(config).each(function(_i,_e){
      var $temp = $(_e.selector);
      if(_e.index){
        $temp = $temp.get(_e.index);
      }
      $("a", $temp).each(function(i, e){
        var item = {};
        var $a = $(e);
        if($a.attr("title")){
          item.link = "http://www.cbrc.gov.cn"+$a.attr("href");
          item.title = $a.attr("title");
          item.categoryName = _e.categoryName;
          item.department="银监会";
          saveData(item);
        }
      })
    })
  })
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
                    "category": item.categoryName,
                    "department": item.department,
                    "link":item.link,
                    "date": formatDate(new Date())
                }
            };
            return docClient.put(params).promise();
          } else {
            // TODO return what?
          }
        }).then(function(){
          console.log(formatDate(new Date(),'yyyy-MM-dd hh:mm:ss') + "保存数据成功:"+JSON.stringify(item));
        });
}
