var Promise = require('bluebird');
var fs      = require('fs');
var cheerio = require('cheerio');
var request = Promise.promisifyAll(require("request"));

if(!fs.existsSync('pics/')){
  fs.mkdirSync('pics/');
}

// 爬取链接内图片地址
findPageLinks().each(function (pageLink) {
  logger ( '正在爬取页面 ' + pageLink )
  return request.getAsync(pageLink).then(function (res) {
    if (res.statusCode === 200) {
      var $ = cheerio.load(res.body);
      var links = [];
      $('.postContent>p>img').each(function (index, el) {
        var link = $(el).attr('src') ? $(el).attr('src') : $(el).attr('href');
        links.push(link);
      });
      return Promise.resolve(links);
    } else {
      return Promise.resolve([]);
    }
  }).each(function (link) {
    if (undefined === link || link.indexOf('uploads') === -1) return;
    var fileName = link.substring(link.indexOf('uploads') + 8, link.length).replace(/[a\/]/g,'');
    var file = 'pics/' + fileName;
    request(link).on('error', function(err) {
      console.log(err)
    }).pipe(fs.createWriteStream(file));
  });
});

// 获取所有页面链接
function findPageLinks() {
  var BASE_URL = 'http://www.meizitu.com';
  return request.getAsync(BASE_URL).then(function (res) {
    if (res.statusCode === 200) {
      $ = cheerio.load(res.body);
      var maxUrl = $('#picture>p>a').attr('href');
      var maxHtml= maxUrl.substring( maxUrl.lastIndexOf('/') + 1, maxUrl.length );
      var count = parseInt(maxHtml);
      return Promise.resolve(count);
    } else {
      return Promise.reject(new Error('code:' + res.statusCode));
    }
  }).then(function (count) {
    var pageLinks = [];
    for(var i = 1; i < count+1; i++) {
      pageLinks.push(BASE_URL + '/a/' + i + '.html');
    }
    return Promise.resolve(pageLinks);
  });
}

function logger ( msg ) {
  process.stdout.clearLine();  // clear current text
  process.stdout.cursorTo(0);  // move cursor to beginning of line
  process.stdout.write(msg);
}
