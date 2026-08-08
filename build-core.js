/*
 * 三省轩主文集 · 构建核心（build-core.js）
 * 解析 articles 文件夹中的 .md 文件，生成结构化文章数据。
 * 同时被「更新工具 build.html」（浏览器）和一次性迁移脚本（Node.js）使用，
 * 保证两条路径产出的数据格式完全一致。本文件不含任何界面代码。
 */
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.DXBuildCore = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {

    var DATA_VERSION = 2;

    function normalizeCategory(raw) {
        var c = (raw || '').trim();
        if (!c) return '未分类';
        if (/诗|绝|律/.test(c)) return '诗';
        if (/词|令|引/.test(c)) return '词';
        if (/散文|赋|记/.test(c)) return '散文';
        return c;
    }

    function parseMarkdown(filename, content) {
        var issues = [];
        var lines = String(content || '').replace(/\r\n?/g, '\n').split('\n');
        var title = '';
        var categoryRaw = '';
        var dateStr = '';
        var bodyLines = [];
        var metaDone = false;
        var i, s;

        for (i = 0; i < lines.length; i++) {
            s = lines[i].trim();

            if (!title) {
                if (s.indexOf('# ') === 0) {
                    title = s.substring(2).trim().replace(/^[《\s]+|[》\s]+$/g, '');
                    continue;
                }
                if (!s) continue;
                continue;
            }

            if (!metaDone) {
                if (s.indexOf('> ') === 0 || s === '>') {
                    var meta = s.substring(1).trim();
                    var parts = meta.replace('｜', '|').split('|');
                    categoryRaw = (parts[0] || '').trim();
                    dateStr = (parts[1] || '').trim();
                    metaDone = true;
                    continue;
                }
                if (!s) continue;
                metaDone = true;
            }

            bodyLines.push(lines[i]);
        }

        if (!title) {
            issues.push({ level: 'error', file: filename, message: '没有找到标题（文章第一行应以「# 」开头，例如：# 我的文章）' });
            return { article: null, issues: issues };
        }
        if (!categoryRaw) {
            issues.push({ level: 'warn', file: filename, message: '缺少分类/日期行（标题下应有一行「> 分类 | 日期」），已按「未分类」处理' });
        }
        if (categoryRaw && !dateStr) {
            issues.push({ level: 'warn', file: filename, message: '分类行里没有日期（标准写法：> 诗 | 乙巳年五月初一），已留空' });
        }

        while (bodyLines.length && !bodyLines[0].trim()) bodyLines.shift();
        while (bodyLines.length && !bodyLines[bodyLines.length - 1].trim()) bodyLines.pop();

        if (bodyLines.length === 0) {
            issues.push({ level: 'warn', file: filename, message: '正文为空' });
        }

        var cleanName = filename.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
        var m = cleanName.match(/^(\d+)/);
        var fileNo = m ? parseInt(m[1], 10) : null;
        if (fileNo === null) {
            issues.push({ level: 'info', file: filename, message: '文件名未以数字编号开头（建议形如「042-文章名.md」），不影响发布' });
        }

        return {
            article: {
                file: filename,
                fileNo: fileNo,
                title: title,
                category: normalizeCategory(categoryRaw),
                date: dateStr || '未标注日期',
                body: bodyLines.join('\n')
            },
            issues: issues
        };
    }

    function buildArticles(files) {
        var sorted = files.slice().sort(function (a, b) {
            return a.name.localeCompare(b.name, 'zh-Hans-CN');
        });
        var articles = [];
        var issues = [];
        var i, r;

        for (i = 0; i < sorted.length; i++) {
            r = parseMarkdown(sorted[i].name, sorted[i].text);
            issues = issues.concat(r.issues);
            if (r.article) articles.push(r.article);
        }

        var seen = {};
        var maxNo = 0;
        for (i = 0; i < articles.length; i++) {
            var n = articles[i].fileNo;
            if (n === null) continue;
            if (seen[n]) {
                issues.push({ level: 'warn', file: articles[i].file, message: '编号 ' + n + ' 与「' + seen[n] + '」重复，建议修改文件名编号' });
            } else {
                seen[n] = articles[i].file;
            }
            if (n > maxNo) maxNo = n;
        }
        if (maxNo > 0 && maxNo <= 9999) {
            var missing = [];
            for (i = 1; i <= maxNo; i++) {
                if (!seen[i]) missing.push(i);
            }
            if (missing.length > 0 && missing.length <= 50) {
                issues.push({ level: 'info', file: '', message: '编号不连续（缺少：' + missing.join('、') + '），不影响发布。若这些文件其实已在 articles 文件夹里，说明它们是在点击「开始更新」之后才放入的——重新点一次即可' });
            }
        }

        for (i = 0; i < articles.length; i++) {
            articles[i].id = i + 1;
        }

        var stats = { total: articles.length, '诗': 0, '词': 0, '散文': 0, '其它': 0 };
        for (i = 0; i < articles.length; i++) {
            var c = articles[i].category;
            if (stats.hasOwnProperty(c)) stats[c]++;
            else stats['其它']++;
        }

        return { articles: articles, issues: issues, stats: stats };
    }

    function serialize(articles, now) {
        var d = now || new Date();
        var pad = function (x) { return (x < 10 ? '0' : '') + x; };
        var ts = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
                 ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        var payload = {
            version: DATA_VERSION,
            generated: ts,
            count: articles.length,
            articles: articles.map(function (a) {
                return { id: a.id, title: a.title, category: a.category, date: a.date, body: a.body };
            })
        };
        return '// 三省轩主文集 · 文章数据（由更新工具自动生成，请勿手工编辑）\n' +
               '// 生成时间：' + ts + '　共 ' + articles.length + ' 篇\n' +
               'const articlesData = ' + JSON.stringify(payload) + ';\n';
    }

    return {
        DATA_VERSION: DATA_VERSION,
        normalizeCategory: normalizeCategory,
        parseMarkdown: parseMarkdown,
        buildArticles: buildArticles,
        serialize: serialize
    };
});
