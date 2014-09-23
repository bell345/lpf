// Determines whether or not a variable is nothing at all.
function isNull(thing) {
    if (thing instanceof Array) {
        for (var i=0;i<thing.length;i++)
            if (isNull(thing[i])) return true;
        return (thing.length == 0)
    } else return (thing == undefined || thing === "" || thing == null || thing.toString() == "NaN");
}
function sort(templst) {
    var min = Math.min.apply(null, templst),
        max = Math.max.apply(null, templst);
    templst = splice(templst, templst.indexOf(min), 1);
    templst = splice(templst, templst.indexOf(max), 1);
    if (templst.length == 0) return [min,max];
    else if (templst.length == 1) return [min,templst[0],max];
    else {
        var newarr = sort(templst);
        newarr.push(max);
        newarr.unshift(min);
        return newarr;
    }
}
function randomInt(num) {
    return Math.floor(Math.random()*num);
}
function fixURL(url) {
    return (location.href.search("github.io/lpf") != -1 ? "/lpf" : "") + url;
}
var testtime = new Date().getTime();
var path = hash = query = {};
var TBI = {
    Net: {
        checkState: function (request) { return request.readyState == 4; },
        XHR: function () { return window.XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP") },
        AJAX: function (url, func, async) {
            var xhr = TBI.Net.XHR();
            xhr.open("GET", url, async?async:true);
            xhr.send();
            xhr.onreadystatechange = function () {
                if (TBI.Net.checkState(xhr)) {
                    if (isNull(xhr.response)) xhr.response = xhr.responseText;
                    if (func instanceof Function) func(xhr);
                }
            }
        },
        MultiAJAX: function (urls, eachCallback, allCallback, timeout, timeoutCallback) {
            var retrievalDone = [], nullfunc = function () { return null; };
            timeout = timeout ? timeout : 5000;
            timeoutCallback = typeof(timeoutCallback) == "function" ? timeoutCallback : nullfunc;
            var timeoutTimer = setTimeout(timeoutCallback, timeout);
            urls.forEach(function (url) {
                TBI.Net.AJAX(url, function (xhr) {
                    retrievalDone.push(true);
                    eachCallback(xhr);
                    if (retrievalDone.length >= urls.length) {
                        clearTimeout(timeoutTimer);
                        allCallback();
                    }
                });
            });
        }
    },
    Util: {
        requestManager: function () {
            var search = location.search;
            if (!isNull(location.search)) {
                search = search.replace("?","").split("&");
                for (var i=0;i<search.length;i++) {
                    search[i] = search[i].split("=");
                    query[search[i][0]] = search[i][1];
                }
            }
            var hash = location.hash;
            if (!isNull(location.hash)) {
                hash = hash.replace("#","").split("&");
                for (var i=0;i<hash.length;i++) {
                    hash[i] = hash[i].split("=");
                    query[hash[i][0]] = hash[i][1];
                }
            }
            if (location.pathname.length > 1) 
                path = location.pathname.replace(/^\//, "").replace(/\/$/, "").replace("lpf/", "").split("/");
        },
        sortTable: function (table, colIndex, direction) {
            if (!(table instanceof HTMLTableElement)) return null; 
            var records = table.querySelectorAll("tbody tr"), 
                refs = {}, 
                fields = [], 
                numbers = true; 
            if (colIndex != -1) for (var i=0;i<records.length;i++) { 
                var list = records[i].querySelectorAll("td");
                var item = list[colIndex].innerText;
                if (numbers && isNaN(parseFloat(item))) numbers = false;
            }
            for (var i=0;i<records.length;i++) { 
                var list = records[i].querySelectorAll("td");
                if (colIndex != -1) {
                    var item = list[colIndex].innerText.toLowerCase();
                    if (numbers) item = parseFloat(item);
                } else var item = parseFloat(records[i].className.match(/ torder-[0-9]{1,}/)[0].match(/[0-9]{1,}/)[0]);
                fields.push(item);
                refs[item] = i;
            }
            if (numbers) fields = sort(fields); 
            else fields.sort();
            if (direction) fields.reverse(); 
            $(table.getElementsByTagName("tbody")[0]).empty(); 
            for (var i=0;i<fields.length;i++) table.getElementsByTagName("tbody")[0].appendChild(records[refs[fields[i]]]); 
        },
        updateUI: function () {
            var images = $(".img-mid:not(.done)");
            for (var i=0;i<images.length;i++) {
                var currimg = images[i];
                var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890", rand = "";
                if (isNull(currimg.id)) { 
                    do {
                        rand = "";
                        for (var j=0;j<4;j++) rand += chars[randomInt(chars.length)];
                    } while ($("#unq-"+rand).length > 0) currimg.id = "unq-"+rand;
                }
                $(currimg.getElementsByClassName("img-toggle")[0]).attr("for", "#" + currimg.id + " img");
                currimg.className += " done";
            }
            $("button.toggle").off("mousedown");
            $("button.toggle").mousedown(function (event) {
                if (event.button != 0 || this.className.search(" dwn") != -1) return true;
                var a = " dwn";
                c = this.className;
                this.className=c.search(a)!=-1?c:c+a;
            });
            $("button.toggle").off("mouseup");
            $("button.toggle").mouseup(function (event) {
                if (event.button != 0 || this.className.search(" dwn") == -1) return true;
                var a = " on",
                    c = this.className.replace(" dwn","");
                this.className=c.search(a)!=-1?c.replace(a,""):c+a;
            });
            $(".up-down").off("mouseup");
            $(".up-down").mouseup(function (event) {
                if (event.button != 0) return true;
                var toSwitch = $($(this).attr("for"));
                if (toSwitch.length > 0) toSwitch.slideToggle();
                var a = " on";
                c = this.className;
                this.className=c.search(a)!=-1?c.replace(a,""):c+a;
            });
            for (var i=0;i<$("table.sortable").length;i++) {
                var currtble = $("table.sortable")[i];
                var rows = currtble.querySelectorAll("tbody tr");
                for (var j=0;j<rows.length;j++) 
                    if (rows[j].className.search(" torder") == -1) rows[j].className += " torder-"+j;
                $(currtble.querySelectorAll("th.sort")).attr("class", "sort none");
                $(currtble.querySelectorAll("th.sort")).off("click");
                $(currtble.querySelectorAll("th.sort")).click(function () {
                    if ($(this).parent()[0].getElementsByTagName("th").length > 0) {
                        var updownList = $(this).parent()[0].getElementsByTagName("th");
                        for (var j=0;j<updownList.length;j++) 
                            if (updownList[j] != this) 
                                updownList[j].className = updownList[j].className.replace(/( up| down)/, " none");
                            else var tIndex = j;
                    }
                    var currclass = this.className;
                    if (currclass.search(" none") != -1) this.className = currclass.replace(" none", " up");
                    else if (currclass.search(" up") != -1) this.className = currclass.replace(" up", " down");
                    else if (currclass.search(" down") != -1) this.className = currclass.replace(" down", " none");
                    if (this.className.search(" down") != -1) 
                        TBI.Util.sortTable($(this).parent().parent().parent()[0], tIndex, true);
                    else if (this.className.search(" up") != -1) 
                        TBI.Util.sortTable($(this).parent().parent().parent()[0], tIndex, false);
                    else if (this.className.search(" none") != -1) 
                        TBI.Util.sortTable($(this).parent().parent().parent()[0], -1, false);
                });
            }
        }
    },
    Includes: {
        info: [],
        includes: [],
        getIndex: function () {
            TBI.Net.AJAX(fixURL("/assets/data/includes.json"), function (xhr) {
                TBI.Includes.info = $.parseJSON(xhr.response).includes;
                TBI.Loader.complete("HTMLIncIndex", TBI.Loader.DONE);
            });
        },
        get: function () {
            var curr = 0,
                getDone = new Array(TBI.Includes.info.length);
            var incTimer = setInterval(function () {
                if (curr > getDone.length - 1 || getDone.length < 1) {
                    clearInterval(incTimer);
                    TBI.Loader.complete("HTMLIncludes", TBI.Loader.DONE);
                } else if (!getDone[curr]) {
                    getDone[curr] = true;
                    TBI.Net.AJAX(fixURL(TBI.Includes.info[curr].source), function (xhr) {
                        TBI.Includes.includes[curr] = xhr.response;
                        var oldHTML = TBI.Includes.info[curr].replace?"":$(TBI.Includes.info[curr].insert).html();
                        $(TBI.Includes.info[curr].insert).html(oldHTML + xhr.response);
                        curr++; 
                    });
                }
            }, 1);
        }
    },
    Nav: {
        data: [],
        check: function () {
            TBI.Nav.data = [];
            var nv = "#top>li";
            for (var i=0;i<$(nv).length;i++) {
                var parent = nv+":nth("+i+")";
                var child = parent+">.inner-nav";
                TBI.Nav.bind(parent, child);
            }
        },
        bind: function (parent, child) {
            if ($(child).length > 0) {
                TBI.Nav.data.push([$(parent)[0], $(child)[0]]);
                $(parent).off("mousemove");
                $(parent).mouseover(function () { $(TBI.Nav.search(this)).show() });
                $(parent).off("mouseleave");
                $(parent).mouseleave(function () { $(TBI.Nav.search(this)).hide() });
                var nv = child+">li";
                for (var i=0;i<$(nv).length;i++) {
                    var parent = nv+":nth("+i+")";
                    var child = parent+">.inner-nav";
                    TBI.Nav.bind(parent, child);
                }
            }
        },
        search: function (s) {
            for (var i=0;i<TBI.Nav.data.length;i++) 
                if (!isNull(TBI.Nav.data[i]) && TBI.Nav.data[i][0] == s) 
                    return TBI.Nav.data[i][1];
            return null;
        }
    },
    Loader: {
        ERR: -2,
        TIMEOUT: -3,
        DONE: -1,
        progress: [],
        completed: [],
        log: [],
        timer: 0,
        done: false,
        settings: {
            timeout: 8000,
            time_until_load_screen: 3000,
            interval: 10
        },
        jobs: [],
        debug: true,
        searchJobs: function (id) {
            for (var i=0;i<TBI.Loader.jobs.length;i++) if (TBI.Loader.jobs[i].id == id) return i;
            return null;
        },
        init: function () {
            TBI.Loader.event("Loader initializing");
            var loaderTimer = setInterval(function () {
                for (var i=0;i<TBI.Loader.jobs.length;i++) TBI.Loader.checkJob(TBI.Loader.jobs[i]);
                if (TBI.Loader.completed.length >= TBI.Loader.jobs.length || 
                    TBI.Loader.timer > TBI.Loader.settings.timeout) {
                    clearInterval(loaderTimer);
                    TBI.Loader.done = true;
                    $(document).trigger("pageload");
                } else if (TBI.Loader.timer > TBI.Loader.settings.time_until_load_screen)
                    $("html")[0].className = $("html")[0].className.replace(" init", " loading");
                TBI.Loader.timer+=TBI.Loader.settings.interval;
            }, TBI.Loader.settings.interval);
        },
        checkJob: function (job) {
            var depSatisfied = true,
                condSatisfied = true;
            if (TBI.Loader.progress.indexOf(job.id) == -1 && TBI.Loader.completed.indexOf(job.id) == -1) {
                job.dependencies.forEach(function (dep) { 
                    if (TBI.Loader.completed.indexOf(dep) == -1) depSatisfied = false; 
                });
                job.conditions.forEach(function (cond) { if (!cond()) condSatisfied = false; });
                if (depSatisfied && condSatisfied) {
                    job.func();
                    TBI.Loader.event("Executed "+job.id);
                    TBI.Loader.progress.push(job.id);
                }
            }
        },
        complete: function (id, status) {
            var loc = TBI.Loader.searchJobs(id);
            if (!isNull(loc) && TBI.Loader.completed.indexOf(id) == -1) TBI.Loader.completed.push(id);
            if (isNull(loc)) var message = id;
            else switch (status) {
                case TBI.Loader.ERR: var message = isNull(TBI.Loader.jobs[loc].error)?
                    id+" failed":TBI.Loader.jobs[loc].error; break;
                case TBI.Loader.TIMEOUT: var message = isNull(TBI.Loader.jobs[loc].timeout)?
                    id+" timed out":TBI.Loader.jobs[loc].timeout; break;
                case TBI.Loader.DONE: var message = isNull(TBI.Loader.jobs[loc].done)?
                    id+" loaded":TBI.Loader.jobs[loc].done; break;
                default: var message = id;
            }
            TBI.Loader.event(message);
        },
        event: function (message, important) {
            TBI.Loader.log.push({time:new Date().getTime() - testtime,message:message});
            if (TBI.Loader.debug || important) 
                console.log("["+(new Date().getTime() - testtime)+"ms] "+message);
        }
    }
};
$(document).on("pageload", function () {
    TBI.Loader.event("Page loaded", true);
    TBI.Nav.check();
});
$(function () {
    TBI.Loader.event("Ready", true);
    TBI.Loader.jobs.push({
        func: TBI.Includes.getIndex,
        id: "HTMLIncIndex",
        dependencies: [],
        conditions: [],
        done: "HTMLIncludes manifest loaded"
    });
    TBI.Loader.jobs.push({
        func: TBI.Includes.get,
        id: "HTMLIncludes",
        dependencies: ["HTMLIncIndex"],
        conditions: []
    });
    TBI.Loader.init();
    TBI.Util.requestManager();
    TBI.Util.updateUI();
});
Array.prototype.forEach = Array.prototype.forEach || function (func) {
    for (var i=0;i<this.length;i++) func(this[i], i, this);
}
Array.prototype.indexOf = Array.prototype.indexOf || function (item) {
    for (var i=0;i<this.length;i++) if (this[i] == item) return i;
    return -1;
}
Array.prototype.equals = Array.prototype.equals || function (arr2) {
    if (!(arr2 instanceof Array) || arr2.length != this.length) return false;
    for (var i=0;i<this.length;i++) if (this[i] != arr2[i]) return false;
    return true;
}
String.prototype.replaceAll = String.prototype.replaceAll || function (toReplace, replacement) {
    var str = this, safety = 0;
    while (str.search(toReplace) != -1 && safety++ < 255) str = str.replace(toReplace, replacement);
    if (safety >= 255) console.error(".replaceAll() has reached an upper limit of 255 replacements. This might be due to the replacement not negating the regex toReplace.");
    return str;
}