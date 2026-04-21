function jsEscape(s)
{
	return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function parseBoxEntry(str)
{
	var m = String(str).match(/^(\S+):\s+"?(.+?)"?\s+by\s+(.+)$/);
	if (!m) return null;
	return { id: m[1], name: m[2], builder: m[3] };
}

var boxRankings = { "": null, "_yearly": null, "_monthly": null };
var builderBoxes = {};

function rebuildBuilderBoxes()
{
	builderBoxes = {};
	var windows = { "": "alltime", "_yearly": "yearly", "_monthly": "monthly" };
	Object.keys(windows).forEach(function(suffix) {
		var tbl = boxRankings[suffix];
		if (!tbl) return;
		Object.keys(tbl).forEach(function(rankStr) {
			var entry = parseBoxEntry(tbl[rankStr]);
			if (!entry) return;
			if (!builderBoxes[entry.builder]) builderBoxes[entry.builder] = {};
			if (!builderBoxes[entry.builder][entry.id]) {
				builderBoxes[entry.builder][entry.id] = { id: entry.id, name: entry.name, ranks: {} };
			}
			builderBoxes[entry.builder][entry.id].ranks[windows[suffix]] = parseInt(rankStr);
		});
	});
}

function loadAllBoxRankings()
{
	["", "_yearly", "_monthly"].forEach(function(suffix) {
		var r = new XMLHttpRequest();
		r.open("GET", BASE + "top_boxes" + suffix + ".json", true);
		r.setRequestHeader("Content-type", "application/json");
		r.onreadystatechange = function() {
			if (r.readyState == 4 && r.status == 200) {
				boxRankings[suffix] = JSON.parse(r.responseText);
				rebuildBuilderBoxes();
			}
		};
		r.send();
	});
}

function showBuilderBoxes(builder)
{
	var boxes = builderBoxes[builder];
	var modal2 = document.getElementById('builder-modal');
	var content = document.getElementById('builder-modal-content');
	var html = "<h3 style=\"margin-top:0;text-align:center;\">Boxes by " + builder + "</h3>";
	if (!boxes || Object.keys(boxes).length === 0) {
		html += "<p style=\"text-align:center;\">No ranked boxes for this builder.</p>";
	} else {
		var ids = Object.keys(boxes).sort(function(a, b) { return parseInt(a) - parseInt(b); });
		html += "<table style=\"width: 80%;margin: 0 auto;\">";
		html += "<tr><th width=\"15%\">Number</th><th>Name</th><th width=\"12%\">All-time</th><th width=\"12%\">Yearly</th><th width=\"12%\">Monthly</th></tr>\n";
		ids.forEach(function(id) {
			var b = boxes[id];
			html += "<tr>";
			html += "<td>" + b.id + "</td>";
			html += "<td>" + getbox(b.id, b.name, builder) + "</td>";
			html += "<td>" + (b.ranks.alltime ? "#" + b.ranks.alltime : "&mdash;") + "</td>";
			html += "<td>" + (b.ranks.yearly ? "#" + b.ranks.yearly : "&mdash;") + "</td>";
			html += "<td>" + (b.ranks.monthly ? "#" + b.ranks.monthly : "&mdash;") + "</td>";
			html += "</tr>\n";
		});
		html += "</table>\n";
	}
	content.innerHTML = html;
	modal2.style.display = "block";
}

function topjsonget(url, id)
{
	var r = new XMLHttpRequest();
	r.open("GET", url, true);
	r.setRequestHeader("Content-type", "application/json")

	r.onreadystatechange = function()
	{
		if (r.readyState == 4 && r.status == 200)
		{
			var tbl = JSON.parse(r.responseText);

			if (id == "box") {
				var s = "<table style=\"width: 80%;margin: 0 auto;\">";
				s += "<tr><th width=\"5%\">Rank</th><th width=\"15%\">Number</th><th>Name</th><th>Builder</th></tr>\n";

				var count = 0;
				for (var i = 1; i <= 25; i++)
				{
					if (!tbl[i]) break;
					s += "<tr>";
					s += "<td>" + i.toString() + "</td>";
					s += "<td>" + tbl[i].split(/: /, 1)[0] + "</td>";
					var ss = tbl[i].split(/: /, 2);
					var builder = ss[1].split(/ by /, 2)[1];
					s += "<td>" + getbox(tbl[i].split(/: /, 1)[0], ss[1].split(/ by /, 1)[0].replace(/"/g, ''), builder) + "</td>";
					s += "<td>" + builder + "</td>";
					s += "</tr>\n";
					count++;
				}
				s += "</table>\n";
				if (count == 0) {
					s = "<p style=\"text-align:center;\">Not enough data for this time period yet.</p>";
				}
			} else if (id == "builder") {
				var s = "<table style=\"width: 80%;margin: 0 auto;\"><tr><th width=\"15%\">Rank</th><th>Name</th></tr>\n";

				var count = 0;
				for (var i = 1; i <= 25; i++)
				{
					if (!tbl[i]) break;
					var name = tbl[i];
					s += "<tr><td>" + i.toString() + "</td>";
					s += "<td><a href=\"#\" onclick=\"showBuilderBoxes('" + jsEscape(name) + "');return false\">" + name + "</a></td></tr>\n";
					count++;
				}
				s += "</table>\n";
				if (count == 0) {
					s = "<p style=\"text-align:center;\">Not enough data for this time period yet.</p>";
				}
			} else {
				var s = "<table style=\"width: 80%;margin: 0 auto;\"><tr><th width=\"15%\">Rank</th><th>Name</th></tr>\n";

				var count = 0;
				for (var i = 1; i <= 25; i++)
				{
					if (!tbl[i]) break;
					s += "<tr><td>" + i.toString() + "</td><td>" + tbl[i] + "</td></tr>\n";
					count++;
				}
				s += "</table>\n";
				if (count == 0) {
					s = "<p style=\"text-align:center;\">Not enough data for this time period yet.</p>";
				}
			}

			document.getElementById(id).innerHTML = s;
		}
	}
	r.send();
}

var BASE = "https://luanti.foo-projects.org/";

function loadRankings(suffix) {
	// Update active tab
	["alltime", "yearly", "monthly"].forEach(function(w) {
		var el = document.getElementById("tab-" + w);
		var active = (suffix === "" && w === "alltime") ||
			(suffix === "_" + w);
		el.innerHTML = active ? "<b>" + el.textContent + "</b>" : el.textContent;
	});

	topjsonget(BASE + "top_players" + suffix + ".json", "player");
	topjsonget(BASE + "top_boxes" + suffix + ".json", "box");
	topjsonget(BASE + "top_builders" + suffix + ".json", "builder");
}

loadRankings("");
loadAllBoxRankings();

(function() {
	var closeEl = document.getElementById('builder-modal-close');
	var modalEl = document.getElementById('builder-modal');
	if (closeEl) {
		closeEl.onclick = function() { modalEl.style.display = 'none'; };
	}
	window.addEventListener('click', function(e) {
		if (e.target == modalEl) modalEl.style.display = 'none';
	});
})();
