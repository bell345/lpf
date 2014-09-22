function zeroPrefix(str, num) {
    str = str.toString();
    num = num ? num : 2;
    while (str.length < num) str = "0" + str;
    return str;
}
Math.bound = function (num, upper, lower) {
    return num>upper?upper:num<lower?lower:num;
}
var CD3 = {
    months: [31,28,31,30,31,30,31,31,30,31,30,31],
    monthNames: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    monthShort: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    dayNames: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    dayShort: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
    terms: ["year","month","day","hour","minute","second"]
};
CD3.nth = function (num) {
    if (num%100>10&&num%100<20) return num + "th";
    else if (num%10==1) return num + "st";
    else if (num%10==2) return num + "nd";
    else if (num%10==3) return num + "rd";
    else return num + "th";
}
CD3.format = function (time, formatstr) {
    var formats = {
        "dddd": CD3.dayNames[time.getDay()],
        "ddd": CD3.dayShort[time.getDay()],
        "dd": zeroPrefix(CD3.nth(time.getDate())),
        "d": CD3.nth(time.getDate()),
        "DD": zeroPrefix(time.getDate()),
        "D": time.getDate(),
        "MMMM": CD3.monthNames[time.getMonth()],
        "MMM": CD3.monthShort[time.getMonth()],
        "MM": zeroPrefix(time.getMonth()+1),
        "M": time.getMonth()+1,
        "yyyy": time.getFullYear(),
        "yy": time.getFullYear().toString().substring(2),
        "HH": zeroPrefix(time.getHours()),
        "H": time.getHours(),
        "h": (time.getHours()%12==0?"12":zeroPrefix(time.getHours()%12)),
        "h": (time.getHours()%12==0?"12":time.getHours()%12),
        "mm": zeroPrefix(time.getMinutes()),
        "m": time.getMinutes(),
        "ss": zeroPrefix(time.getSeconds()),
        "s": time.getSeconds(),
        "tt": (time.getHours()<12?"AM":"PM"),
        "{": "{",
        "}": "}"
    }
    for (var format in formats) if (formats.hasOwnProperty(format))
        while (formatstr.search("{"+format+"}") != -1) formatstr = formatstr.replace("{"+format+"}", formats[format]);
    return formatstr;
}
var Posts = {
    SINGLE_POST: -1,
    SIDE_POSTS: -2,
    POST_PAGE: -3,
    ALL_POSTS: -4,
    settings: {
        url: "/assets/data/posts.json",
        sideInsert: "#sidebar .news-items",
        contentInsert: "#posts",
        maxLength: 500,
        maxSideLength: 5,
        pageLength: 5
    },
    currPage: -1,
    loadedPosts: [],
    loadedSidePosts: [],
    posts: [],
    truncate: function (text, length) {
        return text.replace(new RegExp("([^]{1,"+length+"})[^]{1,}"), "$1...");
    },
    format: function (obj) {
        var html = "<h2><a href='/news/view/?id="+obj.id+"'>"+obj.title+"</a></h2>";
        html += "<h3 class='post-time'>"+CD3.format(Posts.parseDate(obj.lastUpdated), "Updated: {yyyy}-{MM}-{DD} {HH}:{mm}")+"</h3>";
        html += "<div class='post-text'>"+Posts.truncate(obj.text, Posts.settings.maxLength)+"</div>";
        html = html.replaceAll(/<script [^>]{1,}>[^]{1,}?<\/script>/,"");
        return html;
    },
    parseDate: function (datestr) {
        var objs = datestr.split(/[\- :]/);
        if (objs[5] == undefined) objs[5] = 0;
        return new Date(objs[0], objs[1]-1, objs[2], objs[3], objs[4], objs[5]);
    },
    sort: function (arr, sortById) {
        var min = Infinity,
            max = -Infinity, minItem, maxItem;
        arr.forEach(function (item) { 
            var itemTime = sortById ? item.id : Posts.parseDate(item.lastUpdated).getTime();
            if (itemTime < min) { min = itemTime; minItem = item; }
            if (itemTime > max) { max = itemTime; maxItem = item; }
        });
        arr.splice(sortById ? Posts.findPostById(arr, min) : Posts.findPostByDate(arr, min), 1);
        arr.splice(sortById ? Posts.findPostById(arr, max) : Posts.findPostByDate(arr, max), 1);
        if (min == max) return [minItem];
        if (arr.length == 0) return [minItem, maxItem];
        else if (arr.length == 1) return [minItem, arr[0], maxItem];
        else {
            var newArr = Posts.sort(arr);
            newArr.push(maxItem);
            newArr.unshift(minItem);
            return newArr;
        }
    },
    findPostByDate: function (arr, unixTime) {
        for (var i=0;i<arr.length;i++) if (Posts.parseDate(arr[i].lastUpdated).getTime() == unixTime) return i;
        return -1;
    },
    getPostById: function (arr, id) {
        for (var i=0;i<arr.length;i++) if (arr[i].id == id) return arr[i];
        return null;
    },
    findPostById: function (arr, id) {
        for (var i=0;i<arr.length;i++) if (arr[i].id == id) return i;
        return -1;
    }
};
Posts.readyUI = function (currID) {
    if (currID != 0) $(".news-control .prev").attr("href", "/news/view/?id="+(currID-1));
    if (currID != Posts.posts.length - 1) $(".news-control .next").attr("href", "/news/view/?id="+(currID+1));
}
Posts.loadPostInfo = function (func) {
    TBI.Net.AJAX(Posts.settings.url, function (xhr) {
        Posts.posts = $.parseJSON(xhr.response).posts;
        func();
    });
}
Posts.getLatestId = function (callback) {
    Posts.loadPostInfo(function () { callback(Posts.sort(Posts.posts, true).reverse()[0].id) });
}
Posts.loadSidePosts = function () {
    TBI.Net.AJAX(Posts.settings.url, function (xhr) {
        Posts.posts = Posts.sort($.parseJSON(xhr.response).posts, true).reverse();
        console.log(Posts.posts);
        for (var i=0;i<Math.bound(Posts.posts.length, Posts.settings.maxSideLength, 0);i++)
            Posts.loadPost(Posts.posts[i], Posts.SIDE_POSTS);
    });
}
Posts.loadSinglePost = function (postID) {
    TBI.Net.AJAX(Posts.settings.url, function (xhr) {
        Posts.posts = Posts.sort($.parseJSON(xhr.response).posts, true);
        Posts.loadPost(Posts.getPostById($.parseJSON(xhr.response).posts, postID), Posts.SINGLE_POST);
        Posts.readyUI(postID);
    });
}
Posts.loadPostPage = function (page) {
    TBI.Net.AJAX(Posts.settings.url, function (xhr) {
        var min = Posts.settings.pageLength * (page-1),
            max = Posts.settings.pageLength * page;
        Posts.posts = Posts.sort($.parseJSON(xhr.response).posts, true);
        for (var i=min;i<max;i++) Posts.loadPost(Posts.getPostById(Posts.posts, i), Posts.POST_PAGE);
    });
}
Posts.loadAllPosts = function () {
    TBI.Net.AJAX(Posts.settings.url, function (xhr) {
        $.parseJSON(xhr.response).posts.forEach(function (post) { Posts.loadPost(post, Posts.ALL_POSTS) });
    });
}
Posts.loadPost = function (post, type) {
    var p = "class='post post-id-"+post.id+"'";
    switch (type) {
        case Posts.SIDE_POSTS: $(Posts.settings.sideInsert).append("<li "+p+"></li>"); break;
        case Posts.POST_PAGE: $(Posts.settings.contentInsert).append("<article "+p+"></article>"); break;
        case Posts.SINGLE_POST: $(Posts.settings.contentInsert).append("<article "+p+"></article>"); break;
        case Posts.ALL_POSTS: $(Posts.settings.contentInsert).append("<article "+p+"></article>"); break;
    }
    new TBI.Net.AJAX(post.source, function (xhr) {
        if (!isNull(post)) {
            post.text = xhr.response;
            switch (type) {
                case Posts.SIDE_POSTS: 
                    var insert = Posts.settings.sideInsert + " .post-id-" + post.id;
                    $(insert).html(Posts.format(post, type));
                    Posts.loadedSidePosts.push(true);
                    if (Posts.loadedSidePosts.length >= Math.bound(Posts.posts.length, Posts.settings.maxSideLength, 0))
                        TBI.Loader.complete("sidePosts", TBI.Loader.DONE);
                    break;
                case Posts.POST_PAGE:
                    var insert = Posts.settings.contentInsert + " .post-id-" + post.id;
                    $(insert).html(Posts.format(post, type));
                    Posts.loadedPosts.push(true);
                    if (Posts.loadedPosts.length >= Posts.settings.pageLength)
                        TBI.Loader.complete("pagePosts", TBI.Loader.DONE);
                    break;
                case Posts.SINGLE_POST:
                    var insert = Posts.settings.contentInsert + " .post-id-" + post.id;
                    $(insert).html(Posts.format(post, type));
                    TBI.Loader.complete("singlePost", TBI.Loader.DONE);
                    break;
                case Posts.ALL_POSTS:
                    var insert = Posts.settings.contentInsert + " .post-id-" + post.id;
                    $(insert).html(Posts.format(post, type));
                    Posts.loadedPosts.push(true);
                    if (Posts.loadedPosts.length >= Posts.posts.length)
                        TBI.Loader.complete("allPosts", TBI.Loader.DONE);
                    break;
            }
        } else switch (type) {
            case Posts.SIDE_POSTS: TBI.Loader.complete("sidePosts", TBI.Loader.DONE); break;
            case Posts.POST_PAGE: TBI.Loader.complete("pagePosts", TBI.Loader.DONE); break;
            case Posts.SINGLE_POST: TBI.Loader.complete("singlePost", TBI.Loader.DONE); break;
            case Posts.ALL_POSTS: TBI.Loader.complete("allPosts", TBI.Loader.DONE); break;
        }
    }, false);
}
$(function () {
    TBI.Loader.jobs.push({
        func: Posts.loadSidePosts,
        id: "sidePosts",
        dependencies: ["HTMLIncludes"],
        conditions: []
    });
    if (path.equals("news/view".split('/'))) {
        if (!isNull(query.id)) TBI.Loader.jobs.push({
            func: function () { Posts.loadSinglePost(query.id); },
            id: "singlePost",
            dependencies: [],
            conditions: []
        });
        else TBI.Loader.jobs.push({
            func: function () { Posts.getLatestId(Posts.loadSinglePost) },
            id: "singlePost",
            dependencies: [],
            conditions: []
        });
    } else if (path.equals("news".split('/')) && !isNull(query.page)) TBI.Loader.jobs.push({
        func: function () { Posts.loadPostPage(query.page); },
        id: "pagePosts",
        dependencies: [],
        conditions: []
    });
});
$(document).on("pageload", function () {
    
});