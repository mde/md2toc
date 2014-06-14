var md = require('marked')
  , TOC
  , Md2Toc
  , process
  , createNavListItem;

TOC = function (parent, text) {
  this.parent = parent;
  this.text = text;
  this.name = null;
  this.children = [];
  if (parent) {
    parent.children.push(this);
  }
};

Md2Toc = function (txt) {
  var data = process(txt);
  this.contentMd = data.content;
  this.contentHtml = md(data.content);
  this.tocData = data.toc;
  this.tocHtml = createTocHtml(data.toc);
};

process = function (d) {
  var content
    , lines = d.split('\n')
    , sections = []
    , data = []
    , currentLength = 0
    , currentObj = new TOC()
   , topObj = currentObj;

  lines.forEach(function (line) {
    var s
      , t
      , n
      , match
      , pat = /^#{2,4}[^#]/ // Grab h2, h3
      , diff;

    // Found a header line
    if ((match = pat.exec(line))) {
      // Is this a different header level?
      diff = currentLength - match[0].length;
      // Title, trim pounds and spaces
      t = geddy.string.trim(line.replace(pat, ''));
      // Name for anchor-nav, spaces will break anchor name in Firefox
      // Snakeize method-names, strip dots
      n = geddy.string.snakeize(t.replace(/ /g, '_').replace(/\./, ''));
      // If more pound signs, we're descending into children
      if (diff < 0) {
        s = new TOC(currentObj, t);
      }
      // Fewer pound signs, we're going up to next sibling of parent
      else if (diff > 0) {
        // Go up the number of levels of difference in length
        var diff = currentLength - match[0].length
          , parentObj;
        while (diff > -1) {
          parentObj = currentObj.parent;
          currentObj = parentObj;
          diff--;
        }
        s = new TOC(parentObj, t);
      }
      // Same number, next sibling
      else {
        s = new TOC(currentObj.parent, t);
      }
      currentObj = s;
      // Namespace the name of the new TOC object with parent's
      n = s.parent && s.parent.name ? s.parent.name + '_' + n : n;
      s.name = n;
      // Insert a named anchor tag just before the header
      data.push('<a name="' + n + '"></a>');
      currentLength = match[0].length;
    }
    data.push(line);
  });
  content = data.join('\n');
  return {
    content: content
  , toc: topObj
  };
};

createTocHtml = function (item) {
  var res = '';
  if (item.text) {
    res += '<li><a href="#' + item.name + '">' + item.text + '</a>\n';
  }
  if (item.children.length) {
    res += '<ul>\n'
    item.children.forEach(function (child) {
      res += createTocHtml(child);
    });
    res += '</ul>\n';
  }
  res += '</li>';
  return res;
};

exports.Md2Toc = Md2Toc;

