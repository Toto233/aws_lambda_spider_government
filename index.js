var spider_yinjianhui = require('./spider_yinjianhui');
var spider_zhenjianhui = require('./spider_zhenjianhui');
var notify_google_calendar_by_ifttt = require('./notify_google_calendar_by_ifttt');
exports.handler = function(event, context, callback) {
  if(event&&event.resources&&event.resources[0]){
    console.log("触发器是"+event.resources[0]);
    if(event.resources[0].match("notify_google_calender")){//使用了土办法，当event是google calender时，触发特定的脚本
      notify_google_calendar_by_ifttt();
    } else { // 技术问题，由于下面的代码没有办法都使用promise模式实现，就无法保证 通知google calender是最后一个，暂时用这个土办法处理下
      spider_yinjianhui();
      spider_zhenjianhui();
    }
  } else {
    spider_yinjianhui();
    spider_zhenjianhui();
  }
}
