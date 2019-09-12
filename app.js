const express = require("express");
const app = express();

const fs = require("fs");
const csv = require("json2csv");
const moment = require("moment");
require("moment-timezone");
moment.tz.setDefault("Asia/Seoul");

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.urlencoded());
app.use(express.json());
app.use(express.static("data"));

app.get("/", (req, res) => {
	fs.readdir("data/", (err, files) => {
		if (err) res.status(500).send({ result: false });
		res.render("index", {
			files
		});
	});
});
app.get("/delete/:filename", (req, res) => {
	fs.unlink(`data/${req.params.filename}`, err => {
		if (err) res.status(500).send({ result: false });
		res.redirect("/");
	});
});
app.post("/save", (req, res) => {
	var regData = req.body.data;
	if (req.body.label && regData) {
		var data = [];
		console.log(regData);
		try {
			fs.mkdirSync("data");
		} catch (e) {
			if (e.code != "EEXIST") throw e;
		}
		var dateStr = moment().format("YYYY-MM-DDTHH-mm-ss");
		dateStr = dateStr.replace(/:/gi, "-") + "__" + req.body.label;
		for (let i = 0; i < regData[Object.keys(regData)[0]].length; i++) {
			let tmp = {};
			Object.keys(regData).map(key => {
				tmp[key] = regData[key][i];
			});
			data.push(tmp);
		}

		fs.writeFile(`data/${dateStr}.csv`, csv.parse(data), err => {
			if (err) {
				console.log("FAIL");
				res.status(500)
					.send({ result: false, message: "저장 중 에러" })
					.end();
			}
			console.log("CLEAR");
			res.status(200)
				.send({ result: true, message: "성공" })
				.end();
		});
	} else {
		res.status(400)
			.send({ result: false, message: "잘못된 요청" })
			.end();
	}
});

app.get("/:filename", (req, res) => {
	res.redirect("/");
});
app.listen(3000);
